CREATE TABLE "users"(
    "id" SERIAL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL
);
CREATE TABLE "saved_books"(
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER REFERENCES "users"("id"),
    "book_title" TEXT NOT NULL,
    "is_favorite" BOOLEAN DEFAULT FALSE
    CONSTRAINT "unique_user_book" UNIQUE ("user_id", "book_title")
);
CREATE TABLE "comments" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "book_title" TEXT NOT NULL,
    "comment_text" TEXT NOT NULL
);
ALTER TABLE
    "saved_books" ADD CONSTRAINT "saved_books_user_id_foreign" FOREIGN KEY("user_id") REFERENCES "user"("id");
ALTER TABLE
    "comments" ADD CONSTRAINT "comments_user_id_foreign" FOREIGN KEY("user_id") REFERENCES "user"("id");