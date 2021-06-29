db.createUser({
  user: 'visuCodeDbService',
  pwd: 'secretPW',
  roles: [
    {
      role: 'readWrite',
      db: 'test',
    },
  ],
});
