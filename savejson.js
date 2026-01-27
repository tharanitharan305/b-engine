const fs = require("fs");
const path = require("path");

module.exports = function saveJson(json) {
    
    let bookTitle = "";
    let bookImage = "";

    if (json.book && json.book.pages) {
        for (let page of json.book.pages) {
            if (page.layers) {
                for (let layer of page.layers) {
                    if (layer.elements) {
                        for (let element of layer.elements) {
                            if (element.type === "text" && element.data && element.data.value && !bookTitle) {
                                bookTitle = element.data.value;
                            }
                            if (element.type === "image" && element.data && element.data.src && !bookImage) {
                                bookImage = element.data.src;
                            }
                            // Recursively check children
                            if (element.children) {
                                for (let child of element.children) {
                                    if (child.type === "text" && child.data && child.data.value && !bookTitle) {
                                        bookTitle = child.data.value;
                                    }
                                    if (child.type === "image" && child.data && child.data.src && !bookImage) {
                                        bookImage = child.data.src;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Check if output.json exists and has the same book
    const outputPath = path.join(__dirname, "outputs", "output.json");
    let version = "1.0";
    if (fs.existsSync(outputPath)) {
        try {
            const existingData = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
            if (existingData.bookName === bookTitle) {
                // Increment version
                const currentVersion = existingData.version;
                const [major, minor] = currentVersion.split(".").map(Number);
                if (minor < 9) {
                    version = `${major}.${minor + 1}`;
                } else {
                    version = `${major + 1}.0`;
                }
            }
        } catch (e) {
            // If error reading, start from 1.0
        }
    }

    // Add attributes to json
    json.version = version;
    json.bookName = bookTitle;
    json.bookImage = bookImage;

    // Save
    const jsonString = JSON.stringify(json, null, 2);
    fs.writeFileSync(outputPath, jsonString);
}