# ReThread Chrome Extension

This Chrome extension helps you find second-hand alternatives while browsing fast fashion websites. It automatically searches for similar items on popular second-hand platforms like Depop, Grailed, and Poshmark.

## Features

- Automatically detects products on fast fashion websites (H&M, Shein, Zara)
- Searches for similar items on second-hand platforms (Depop, Grailed, Poshmark)
- Customizable platform preferences
- Clean and intuitive user interface
- Real-time product matching

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## Usage

1. Browse any supported fast fashion website (H&M, Shein, or Zara)
2. Click the extension icon in your Chrome toolbar
3. View similar second-hand alternatives from Depop, Grailed, and Poshmark
4. Click on any result to view the item on the respective platform
5. Use the settings to enable/disable specific platforms

## Supported Websites

### Fast Fashion Websites
- H&M
- Shein
- Zara

### Second-hand Platforms
- Depop
- Grailed
- Poshmark

## Development

The extension is built using vanilla JavaScript and Chrome Extension APIs. The main components are:

- `manifest.json`: Extension configuration
- `popup.html/js/css`: User interface
- `content.js`: Product information extraction
- `background.js`: API communication and search functionality

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
