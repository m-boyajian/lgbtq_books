// Function to create an SVG icon element
export function createSVGIcon(iconPath) {
    const svgIcon = document.createElement("img");
    svgIcon.src = iconPath;
    return svgIcon;
  }
  
const baseUrl = staticUrl + "images/";
// Array of genres with corresponding images and icons
export const genres = [  
  { name: "Romance", image: baseUrl + "genre-tiles/romance.png" },
  { name: "Sci-Fi", image: baseUrl + "genre-tiles/fantasy.png" },
  { name: "History", image: baseUrl + "genre-tiles/history.png" },
  { name: "Self-Help", image: baseUrl + "genre-tiles/self-care.png" },
  { name: "Mystery", image: baseUrl + "genre-tiles/mystery.png" },
  { name: "Fiction", image: baseUrl + "genre-tiles/fiction.png" },
];
// svg icon imports
export const icons = [
  baseUrl + "svg-icons/fire.svg",
  baseUrl + "svg-icons/ufo-outline.svg",
  baseUrl + "svg-icons/bullhorn-variant-outline.svg",
  baseUrl + "svg-icons/handshake-outline.svg",
  baseUrl + "svg-icons/magnify.svg",
  baseUrl + "svg-icons/book-open-blank-variant.svg",
];
  