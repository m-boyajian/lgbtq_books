"""dropped Author, Publisher, and Comment tables

Revision ID: 4ff553ef84f9
Revises: 007e08c212b5
Create Date: 2023-11-23 14:23:59.770963

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4ff553ef84f9'
down_revision = '007e08c212b5'
branch_labels = None
depends_on = None


def upgrade():
    # Drop foreign key constraints in the books table
    with op.batch_alter_table('books', schema=None) as batch_op:
        batch_op.drop_constraint('books_publisher_id_fkey', type_='foreignkey')
        batch_op.drop_constraint('books_author_id_fkey', type_='foreignkey')

    # Drop the authors and publishers tables
    op.drop_table('authors')
    op.drop_table('publishers')

    # Add author and publisher columns to the books table
    with op.batch_alter_table('books', schema=None) as batch_op:
        batch_op.add_column(sa.Column('author', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('publisher', sa.String(), nullable=True))

        # Drop existing columns (if needed)
        batch_op.drop_column('publisher_id')
        batch_op.drop_column('author_id')


def downgrade():
    # Recreate authors and publishers tables
    op.create_table('publishers',
        sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column('name', sa.VARCHAR(length=100), autoincrement=False, nullable=False),
        sa.PrimaryKeyConstraint('id', name='publishers_pkey')
    )
    op.create_table('authors',
        sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column('name', sa.VARCHAR(length=40), autoincrement=False, nullable=True),
        sa.Column('biography', sa.TEXT(), autoincrement=False, nullable=True),
        sa.PrimaryKeyConstraint('id', name='authors_pkey')
    )

    # Add back the author_id and publisher_id columns to the books table
    with op.batch_alter_table('books', schema=None) as batch_op:
        batch_op.add_column(sa.Column('author_id', sa.INTEGER(), autoincrement=False, nullable=True))
        batch_op.add_column(sa.Column('publisher_id', sa.INTEGER(), autoincrement=False, nullable=True))

        # Recreate foreign key constraints in the books table
        batch_op.create_foreign_key('books_author_id_fkey', 'authors', ['author_id'], ['id'])
        batch_op.create_foreign_key('books_publisher_id_fkey', 'publishers', ['publisher_id'], ['id'])

        # Drop existing columns (if needed)
        batch_op.drop_column('publisher')
        batch_op.drop_column('author')
