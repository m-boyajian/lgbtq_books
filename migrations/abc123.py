"""Recreate Saved_Books table.

Revision ID: abc123
Revises: 3fcea2efcd0e
Create Date: 2023-12-03 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'abc123'
down_revision = '3fcea2efcd0e'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('saved_books',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('book_id', sa.Integer(), nullable=False),
        sa.Column('date_saved', sa.TIMESTAMP(), nullable=False),
        sa.Column('cover_url', sa.TEXT(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='saved_books_user_id_fkey'),
        sa.ForeignKeyConstraint(['book_id'], ['books.id'], name='saved_books_book_id_fkey'),
        sa.UniqueConstraint('user_id', 'book_id', name='uq_saved_books_user_book')
    )

def downgrade():
    op.drop_table('saved_books')
