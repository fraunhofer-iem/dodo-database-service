set -e

mongo <<EOF
use $MONGO_INITDB_DATABASE
db.createUser({
  user:  '$DB_USER',
  pwd: '$DB_USER_PASSWORD',
  roles: [{
    role: 'readWrite',
    db: '$MONGO_INITDB_DATABASE'
  }]
})
EOF
