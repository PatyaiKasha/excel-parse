# DataFlow - A Visual Data Transfer Application

DataFlow is a desktop application designed to revolutionize data transfer, transforming it from a complex, code-driven task into a simple, visual, and intuitive process. Built for non-technical users, DataFlow removes the need for scripting or complex configurations.

The user experience is centered around a clean, visual canvas where users can literally see their data's journey by connecting sources to destinations.

## Features
- **Visual Mapping:** Drag and drop data sources onto a canvas and draw lines between fields to create a transfer map.
- **File System Integration:** Add local Excel files as data sources.
- **Live Preview:** Instantly see a preview of how data will be transferred when you connect two fields.
- **Full Data Transfer:** Execute the complete data transfer based on your visual map and save the output to a new Excel file.
- **Error Handling:** A status bar provides clear feedback on successes and errors.
- **Dynamic UI:** Select and delete nodes and connections on the canvas.

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (which includes npm)
- [Git](https://git-scm.com/)

### Installation & Running

1.  **Clone the repository:**
    ```bash
    git clone <URL_OF_THE_REPO>
    cd <repository_folder_name>
    ```

2.  **Install dependencies:**
    This command reads the `package.json` file and installs all necessary libraries, including Electron.
    ```bash
    npm install
    ```

3.  **Run the application:**
    This command starts the Electron application.
    ```bash
    npm start
    ```

## How It Works
1.  Click the "Add Source File" button to select an Excel file from your computer.
2.  A new draggable item representing your file will appear in the "Sources" panel.
3.  Drag this item onto the central canvas. A "node" will be created.
4.  Click the header of the node to expand it and view the column headers from your file.
5.  Create multiple nodes (e.g., another source or a destination).
6.  Click and drag from a field's handle on one node to a handle on another node to create a connection.
7.  View the "Live Preview" panel at the bottom to see a sample of the data transfer.
8.  Click the "Run Transfer" button to execute the full data transfer and save the result to a new file.
9.  To delete a node or connection, click on it to select it, then press the `Delete` or `Backspace` key.
