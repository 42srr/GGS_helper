#!/bin/bash
set -e

# Remove the scram-sha-256 line from pg_hba.conf
sed -i '/scram-sha-256/d' /var/lib/postgresql/data/pg_hba.conf

# Add trust authentication for all connections (development only!)
echo "host all all all trust" >> /var/lib/postgresql/data/pg_hba.conf

echo "PostgreSQL authentication configured for development (trust mode)"
