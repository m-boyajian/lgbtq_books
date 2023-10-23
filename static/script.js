function randomRGB() {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgb(${r},${g},${b})`;
}

const letters = document.querySelectorAll('.letter');

setInterval(function () {
  for (let letter of letters) {
    letter.style.color = randomRGB();
  }
}, 1000);

const apiKey = "AIzaSyABwXgHtTnZQ0Y4eZcNuknYiLAL7Epynyw";
const baseBookUrl = `https://www.googleapis.com/books/v1/volumes?key=${apiKey}`;

if (window.location.pathname === '/') {
  let bookContainer;

  $(document).ready(function () {
    bookContainer = document.getElementById("book-container");

    // Rest of your code for the index.html page
    // Event listener for the search button
    $("#search").click(function () {
      bookContainer.innerHTML = ""; // Clear book container
      searchData = $("#search-box").val().trim();

      if (searchData === "") {
        displayError();
      } else {
        const bookUrl = `${baseBookUrl}&q=${searchData}`;
        axios
          .get(bookUrl)
          .then(function (response) {
            console.log(response);
            const books = response.data.items;
            displayBooks(books); 
          })
          .catch(function (error) {
            console.error(error);
          });
      }
      $("#search-box").val("");
    });

    // Handle error for empty search box
    function displayError() {
      alert("Search term cannot be empty!");
    }

    function formatOutput(imageUrl, title, author, publisher, previewLink, identifier) {
      return `
        <div class="card col-md-4">
          <img src="${imageUrl}" class="card-img-top" alt="Book Image">
          <div class="card-body">
            <h5 class="card-title">${title}</h5>
            <p class="card-text">Author: ${author}</p>
            <p class="card-text">Publisher: ${publisher}</p>
            <a href="${previewLink}" class="btn btn-primary" target="_blank">Read Book</a>
          </div>
        </div>
      `;
    }
    // New function to display books in a grid layout
    function displayBooks(books) {
      bookContainer.innerHTML = ""; // Clear previous results

      for (const book of books) {
        console.log(book.volumeInfo.industryIdentifiers);
        
        let identifier = ''; // Initialize with an empty string
        const identifiers = book.volumeInfo.industryIdentifiers;

        if (identifiers && identifiers.length > 1) {
          // Check if there are at least 2 identifiers
          if (identifiers[1] && identifiers[1].identifier) {
            identifier = identifiers[1].identifier;
          }
        } else if (identifiers && identifiers.length === 1) {
          // Check if there is only 1 identifier
          if (identifiers[0] && identifiers[0].identifier) {
            identifier = identifiers[0].identifier;
          }
        }

        const bookCard = formatOutput(
          book.volumeInfo.imageLinks.thumbnail,
          book.volumeInfo.title,
          book.volumeInfo.authors[0],
          book.volumeInfo.publisher,
          book.volumeInfo.previewLink,
          identifier
        );
        
        bookContainer.innerHTML += bookCard;
      }
      bookContainer.style.visibility = "visible";
    }
  });  
}

function createSVGIcon(iconPath) {
  const svgIcon = document.createElement("img");
  svgIcon.src = iconPath;
  return svgIcon;
}

const genres = [
  { name: "scifi", image: staticUrl + "fantasy.png" },
  { name: "romance", image: staticUrl + "romance.png" },
  { name: "history", image: staticUrl + "history.png" },
  { name: "selfcare", image: staticUrl + "self-care.png" },
  { name: "mystery", image: staticUrl + "mystery.png" },
  { name: "fiction", image: staticUrl + "fiction.png" },
];

const icons = [
  "/static/svg-icons/ufo-outline.svg",
  "/static/svg-icons/fire.svg",
  "/static/svg-icons/bullhorn-variant-outline.svg",
  "/static/svg-icons/handshake-outline.svg",
  "/static/svg-icons/magnify.svg",
  "/static/svg-icons/book-open-blank-variant.svg",
];

document.addEventListener("DOMContentLoaded", function () {
  const genreContainer = document.getElementById("genre-container");

  if (genreContainer) {
    console.log("Genre container found: ", genreContainer);

  genres.forEach((genre, index) => {
    const tile = document.createElement("div");
    tile.classList.add("genre-tile");

    // Creates image element for the MDI icon
    const icon = createSVGIcon(icons[index]);
    icon.classList.add("icon");

    const link = document.createElement("a");
    link.classList.add("genre-link");
    link.href = `/genre/${genre.name.toLowerCase().replace(/\//g, "_")}`;

    // Creates image element for the genre image
    const genreImage = document.createElement("img");
    genreImage.src = genre.image;

    // Creates variable to capture the current genre name
    let genreName = genre.name;

    const name = document.createElement("p");
    name.textContent = genreName;
  
    tile.appendChild(icon);
    tile.appendChild(genreImage);
    tile.appendChild(name);
    tile.appendChild(link);

    genreContainer.appendChild(tile);
  
    link.addEventListener("click", function (event) {
      event.preventDefault();
      console.log("Clicked on genre: " + genreName);
      window.location.href = link.href; // Redirect to the URL specified in the link
    }); 
  });
  } else {
    console.log("Genre container not found");
  }
});
