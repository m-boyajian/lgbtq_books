CREATE TABLE "books"(
    "id" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "author_id" BIGINT NOT NULL,
    "genre_id" INTEGER NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "cover_url" VARCHAR(255) NOT NULL
);
ALTER TABLE
    "books" ADD PRIMARY KEY("id");
CREATE TABLE "user"(
    "id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL
);
ALTER TABLE
    "user" ADD PRIMARY KEY("id");
CREATE TABLE "genres"(
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL
);
ALTER TABLE
    "genres" ADD PRIMARY KEY("id");
CREATE TABLE "authors"(
    "id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "biography" VARCHAR(255) NULL
);
ALTER TABLE
    "authors" ADD PRIMARY KEY("id");
CREATE TABLE "saved_books"(
    "id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "book_id" BIGINT NOT NULL,
    "date_saved" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
    "cover_url" VARCHAR(255) NOT NULL
);
ALTER TABLE
    "saved_books" ADD PRIMARY KEY("id");
CREATE TABLE "comments"(
    "id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "book_id" BIGINT NOT NULL,
    "comment_text" TEXT NOT NULL,
    "time" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL
);
ALTER TABLE
    "comments" ADD PRIMARY KEY("id");
ALTER TABLE
    "saved_books" ADD CONSTRAINT "saved_books_book_id_foreign" FOREIGN KEY("book_id") REFERENCES "books"("id");
ALTER TABLE
    "comments" ADD CONSTRAINT "comments_book_id_foreign" FOREIGN KEY("book_id") REFERENCES "books"("id");
ALTER TABLE
    "books" ADD CONSTRAINT "books_genre_id_foreign" FOREIGN KEY("genre_id") REFERENCES "genres"("id");
ALTER TABLE
    "books" ADD CONSTRAINT "books_author_id_foreign" FOREIGN KEY("author_id") REFERENCES "authors"("id");
ALTER TABLE
    "saved_books" ADD CONSTRAINT "saved_books_user_id_foreign" FOREIGN KEY("user_id") REFERENCES "user"("id");
ALTER TABLE
    "comments" ADD CONSTRAINT "comments_user_id_foreign" FOREIGN KEY("user_id") REFERENCES "user"("id");