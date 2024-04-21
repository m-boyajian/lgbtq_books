// Main script and container for the genre-container

import { colorizeLetters } from './randomColor.js';
colorizeLetters();
import { genres, icons, createSVGIcon } from './genre_tiles.js';
import { initializeBookContainer } from './bookContainer.js';
import { initializeGenreContainer } from './genreContainer.js';

$(document).ready(function () {
  console.log("DOMContentLoaded event fired");

  // Clears genreName in session storage if user goes back to homepage
  if (window.location.pathname === '/') {
    sessionStorage.clear();
  }

  const genreContainer = document.getElementById("genre-container");

  if (genreContainer) {
    console.log("Genre container found: ", genreContainer);

    genres.forEach((genreItem, index) => {
      const tile = document.createElement("div");
      tile.classList.add("genre-tile");

      // Creates image element for the MDI icon
      const icon = createSVGIcon(icons[index]);
      icon.classList.add("icon");

      const link = document.createElement("a");
      link.classList.add("genre-link");
      // Set the value of the genre variable
      const genreName = genreItem.name;
      link.href = `/genre?genre=${encodeURIComponent(genreName.toLowerCase().replace('/', '_'))}`;

      // Creates image element for the genre image
      const genreImage = document.createElement("img");
      genreImage.src = genreItem.image;

      const name = document.createElement("p");
      name.textContent = genreName;

      tile.appendChild(icon);
      tile.appendChild(genreImage);
      tile.appendChild(name);
      tile.appendChild(link);

      genreContainer.appendChild(tile);

      link.addEventListener("click", async function (event) {
        event.preventDefault();
        console.log("Clicked on genre: " + genreName);
      
        let clickedGenre;  
          
        try {
          // Store the clicked genre information in sessionStorage
          clickedGenre = genreName.toLowerCase().replace(/\//g, "_");
          console.log('Clicked genre:', clickedGenre)
          sessionStorage.setItem('clickedGenre', clickedGenre);
          console.log('Stored clicked genre:', clickedGenre);
      
          // Dispatch the custom event with the clicked genre
          const genreClickEvent = new CustomEvent("genreClicked", { detail: { genre: clickedGenre } });
          document.dispatchEvent(genreClickEvent);
      
          // Redirect to the genre page
          window.location.href = `/genre/${encodeURIComponent(clickedGenre.toLowerCase().replace('/', '_'))}`;
        } catch (error) {
          console.error("Error storing clicked genre:", error);
        } 
      });      
    });
  }
});

initializeBookContainer();
initializeGenreContainer();