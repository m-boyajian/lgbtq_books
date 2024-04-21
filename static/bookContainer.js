// Book card container logic

import { baseBookUrl, currentPage, booksPerPage, maxResults, startIndex } from './common.js';

export function initializeBookContainer() {
  $(document).ready(function () {
    if (window.location.pathname === '/') {
      let bookContainer;
      let searchData;

      bookContainer = document.getElementById("book-container");
      console.log("Book container found", bookContainer);
    
      function formatOutput(imageUrl, title, author, publisher, previewLink, isFavorite) {
        console.log("isFavorite:", isFavorite);
        return `
          <div class="card col-md-4">
            <img src="${imageUrl}" class="card-img-top" alt="Book Image">
            <div class="card-body">
              <h5 class="card-title">${title}</h5>
              <p class="card-text author-text">Author: ${author}</p>
              <p class="card-text">Publisher: ${publisher}</p>
              <p>Is Favorite: ${isFavorite}</p>
              <a href="${previewLink}" class="read-button" target="_blank">Read Book</a>
              <button class="favorite-button" data-title="${title}" data-favorite="${isFavorite}">
                <img class="outline-star" src="/static/star-regular.svg" alt="Outline Star" style="${isFavorite ? 'display: none' : 'display: block'}">
                <img class="solid-star" src="/static/star-solid.svg" alt="Solid Star" style="${isFavorite ? 'display: block' : 'display: none'}">
              </button>
            </div>
          </div>
        `;
      } 
      
      function checkIfBookIsFavorite(title, callback) {
        console.log("Checking if book is a favorite:", title);
        // Use AJAX to send a request to the server to check if the book is a favorite
        $.ajax({
            url: `/check_favorite?title=${title}`, // Define a route in app.py to handle this request
            type: 'GET',
            success: function (data) {
                // The server should return 'true' or 'false' as a response
                const isFavorite = data === 'true';
                callback(isFavorite);
            },
            error: function (xhr) {
                if (xhr.status === 401) {
                    // Handle the case when the user is not authenticated
                    // Assuming the book is not a favorite for non-authenticated users
                    const isFavorite = false;
                    callback(isFavorite);
                } else {
                    // Handle other errors or display an error message
                    console.error("Error checking if book is a favorite:", xhr.statusText);
                }
            }
        });
      }
    
      async function displayBooks(books) {
        bookContainer.innerHTML = ""; 
        const startIdx = (currentPage - 1) * booksPerPage;
        const endIdx = startIdx + booksPerPage;
      
        for (const book of books.slice(startIdx, endIdx)) {
          checkIfBookIsFavorite(book.volumeInfo.title, (isFavorite) => {
      
          const bookCard = formatOutput(
            book.volumeInfo.imageLinks.thumbnail,
            book.volumeInfo.title,
            book.volumeInfo.authors[0],
            book.volumeInfo.publisher,
            book.volumeInfo.previewLink,
            isFavorite
          );
      
          bookContainer.innerHTML += bookCard;
          });
        }
      
        bookContainer.style.visibility = "visible";
      }  

      // Event listener for the search button
      $("#search").click(function () {
        bookContainer.innerHTML = ""; // Clear book container
        searchData = $("#search-box").val().trim();
        console.log("Search data", searchData);

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
    
      // Handle error for an empty search box.
      function displayError() {
        alert("Search term cannot be empty!");
      }

      // Function to fetch books
      function fetchBooks(query, maxResults, startIdx) {
        const bookUrl = `${baseBookUrl}&q=${query}&maxResults=${maxResults}&startIndex=${startIdx}`;
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

      // Initialize with an empty result
      displayBooks([]);
    
      // Event listener for the star icons
      bookContainer.addEventListener("click", (event) => {
        event.preventDefault();
        const target = event.target;
        console.log("Clicked on:", target);
        console.log("Parent element:", target.parentElement);
        if (target.classList.contains("outline-star") || target.classList.contains("solid-star")) {
          const button = target.parentElement;
          const title = button.getAttribute("data-title");
          const isFavorite = button.getAttribute("data-favorite") === "true";

          console.log("Title:", title);
          console.log("Is favorite:", isFavorite);

          const solidStar = button.querySelector(".solid-star");
          const outlineStar = button.querySelector(".outline-star");

          console.log("Solid Star:", solidStar);
          console.log("Outline Star:", outlineStar);

          if (isFavorite) {
            // Remove the book from favorites.
            console.log("Removing from favorites");
            removeBookFromFavorites(title);
            solidStar.style.display = "none";
            outlineStar.style.display = "block";
            button.setAttribute("data-favorite", "false");
          } else {
            // Add the book to favorites.
            console.log("Adding to favorites");
            addBookToFavorites(title);
            outlineStar.style.display = "none";
            solidStar.style.display = "block";
            button.setAttribute("data-favorite", "true");
          }
        }
      });
    
      // AJAX function to add a book to favorites
      function addBookToFavorites(title) {
        $.ajax({
          url: `/add_to_favorites`,
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({ title: title }),
          success: function (data) {
            // Handle the success response
          },
          error: function () {
            // Handle the error or display an error message
          }
        });
      }
          
      function removeBookFromFavorites(title) {
        $.ajax({
          url: `/remove_from_favorites`,
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({ title: title }),
          success: function (data) {
            // Handle the success response
          },
          error: function () {
            // Handle the error or display an error message
          }
        });
      }
    
      // Event listener for the "Next" button
      $("#next-button").click(function () {
        startIndex += maxResults;
        fetchBooks(searchData, maxResults, startIndex);
      });

      // Event listener for the "Previous" button
      $("#prev-button").click(function () {
        if (startIndex - maxResults >= 0) {
            startIndex -= maxResults;
            fetchBooks(searchData, maxResults, startIndex);
        }
      });
    }
  });
}