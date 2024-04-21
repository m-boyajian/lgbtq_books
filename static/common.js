let currentPage = 1;
const booksPerPage = 12;
const maxResults = 40;
let startIndex = 0;
const apiKey = "AIzaSyABwXgHtTnZQ0Y4eZcNuknYiLAL7Epynyw";
const baseBookUrl = `https://www.googleapis.com/books/v1/volumes?key=${apiKey}`;

export { baseBookUrl, currentPage, booksPerPage, maxResults, startIndex };