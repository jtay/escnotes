use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Serialize, Deserialize)]
struct Note {
    title: String,
    content: String,
    created_at: String,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_available_printers() -> Result<Vec<String>, String> {
    #[cfg(target_os = "macos")]
    {
        let output = Command::new("lpstat")
            .arg("-p")
            .output()
            .map_err(|e| format!("Failed to execute lpstat: {}", e))?;
        
        let output_str = String::from_utf8_lossy(&output.stdout);
        let printers: Vec<String> = output_str
            .lines()
            .filter_map(|line| {
                if line.starts_with("printer") {
                    line.split_whitespace().nth(1).map(|s| s.to_string())
                } else {
                    None
                }
            })
            .collect();
        
        Ok(printers)
    }
    
    #[cfg(target_os = "windows")]
    {
        let output = Command::new("wmic")
            .args(&["printer", "get", "name", "/format:list"])
            .output()
            .map_err(|e| format!("Failed to execute wmic: {}", e))?;
        
        let output_str = String::from_utf8_lossy(&output.stdout);
        let printers: Vec<String> = output_str
            .lines()
            .filter_map(|line| {
                if line.starts_with("Name=") {
                    line.strip_prefix("Name=").map(|s| s.to_string())
                } else {
                    None
                }
            })
            .collect();
        
        Ok(printers)
    }
    
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        Ok(vec![])
    }
}

#[tauri::command]
fn print_note(note: Note, printer_name: String, printer_width: u32) -> Result<(), String> {
    // Create a temporary file with the note content
    let temp_file = format!("/tmp/note_{}.txt", chrono::Utc::now().timestamp());
    
    // Convert markup to ESC/POS commands
    let content = convert_markup_to_escpos(&note.content, printer_width, &note.title);
    
    std::fs::write(&temp_file, content)
        .map_err(|e| format!("Failed to write temp file: {}", e))?;
    
    // Print using OS-specific commands
    #[cfg(target_os = "macos")]
    {
        let status = Command::new("lp")
            .args(&["-d", &printer_name, &temp_file])
            .status()
            .map_err(|e| format!("Failed to execute lp: {}", e))?;
        
        if !status.success() {
            return Err("Print command failed".to_string());
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        let status = Command::new("print")
            .arg(&temp_file)
            .status()
            .map_err(|e| format!("Failed to execute print: {}", e))?;
        
        if !status.success() {
            return Err("Print command failed".to_string());
        }
    }
    
    // Clean up temp file
    let _ = std::fs::remove_file(&temp_file);
    
    Ok(())
}

#[tauri::command]
fn export_note(note: Note) -> Result<(), String> {
    // For now, just save to desktop
    let desktop = std::env::var("HOME")
        .map_err(|_| "Could not find home directory".to_string())?;
    
    let filename = format!("{}/Desktop/{}.txt", desktop, note.title.replace(" ", "_"));
    let content = format!("Title: {}\nDate: {}\n\n{}", note.title, note.created_at, note.content);
    
    std::fs::write(&filename, content)
        .map_err(|e| format!("Failed to export note: {}", e))?;
    
    Ok(())
}

fn convert_markup_to_escpos(content: &str, width: u32, title: &str) -> String {
    let mut result = String::new();
    
    // ESC/POS initialization
    result.push_str("\x1B\x40"); // Initialize printer
    
    // Add 3 line breaks at the top
    result.push_str("\n\n\n");
    
    // Add title if provided
    if !title.trim().is_empty() {
        result.push_str("\x1B\x21\x30"); // Double height and width
        result.push_str(title.trim());
        result.push_str("\x1B\x21\x00"); // Normal size
        result.push('\n');
    }
    
    // Add printed date/time
    let now = chrono::Local::now();
    let date_str = now.format("%d/%m/%Y").to_string();
    let time_str = now.format("%H:%M").to_string();
    result.push_str(&format!("Printed {} at {}", date_str, time_str));
    result.push_str("\n\n");
    
    // Replace Unicode ellipsis with three dots for printer compatibility
    let safe_content = content.replace('…', "...");
    
    for line in safe_content.lines() {
        let mut processed_line = line.to_string();
        
        // Process alignment tags
        processed_line = processed_line
            .replace("<center>", "\x1B\x61\x01") // Center alignment
            .replace("</center>", "\x1B\x61\x00") // Left alignment
            .replace("<right>", "\x1B\x61\x02") // Right alignment
            .replace("</right>", "\x1B\x61\x00") // Left alignment
            .replace("<left>", "\x1B\x61\x00"); // Left alignment
        
        // Process formatting tags
        processed_line = processed_line
            .replace("<bold><large>", "\x1B\x45\x01\x1B\x21\x30") // Bold on + Double height and width
            .replace("</large></bold>", "\x1B\x21\x00\x1B\x45\x00") // Normal size + Bold off
            .replace("<large>", "\x1B\x21\x30") // Double height and width
            .replace("</large>", "\x1B\x21\x00") // Normal size
            .replace("<bold>", "\x1B\x45\x01") // Bold on
            .replace("</bold>", "\x1B\x45\x00") // Bold off
            // .replace("£", "\u{00A3}") // Pound symbol - keep as is for most printers
            .replace("<cut>", "\x1D\x56\x41\x00") // Cut paper
            .replace("<divider>", ""); // Remove dividers from print output
        
        result.push_str(&processed_line);
        result.push('\n');
    }
    
    // Add 3 line breaks at the bottom before cutting
    result.push_str("\n\n\n");
    
    // Cut paper at the end
    result.push_str("\x1D\x56\x41\x00");
    
    result
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_available_printers,
            print_note,
            export_note
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
