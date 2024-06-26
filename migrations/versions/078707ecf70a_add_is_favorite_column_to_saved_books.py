"""Add is_favorite column to Saved_Books

Revision ID: 078707ecf70a
Revises: 4ff553ef84f9
Create Date: 2023-11-25 17:57:41.591067

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '078707ecf70a'
down_revision = '4ff553ef84f9'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('comments')
    with op.batch_alter_table('saved_books', schema=None) as batch_op:
        batch_op.add_column(sa.Column('is_favorite', sa.Boolean(), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('saved_books', schema=None) as batch_op:
        batch_op.drop_column('is_favorite')

    op.create_table('comments',
    sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('user_id', sa.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('book_id', sa.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('comment_text', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('time', postgresql.TIMESTAMP(), autoincrement=False, nullable=True),
    sa.ForeignKeyConstraint(['book_id'], ['books.id'], name='comments_book_id_fkey'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='comments_user_id_fkey'),
    sa.PrimaryKeyConstraint('id', name='comments_pkey')
    )
    # ### end Alembic commands ###
