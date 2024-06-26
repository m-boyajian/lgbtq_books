"""Add author relationship to Books model

Revision ID: 007e08c212b5
Revises: 88090e05cefd
Create Date: 2023-11-20 19:09:22.692071

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '007e08c212b5'
down_revision = '88090e05cefd'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('genres')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('genres',
    sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('name', sa.VARCHAR(length=40), autoincrement=False, nullable=True),
    sa.Column('description', sa.TEXT(), autoincrement=False, nullable=True),
    sa.PrimaryKeyConstraint('id', name='genres_pkey')
    )
    # ### end Alembic commands ###
