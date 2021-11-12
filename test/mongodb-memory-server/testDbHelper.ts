import { MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Db } from "mongodb";
import { Mongoose } from "mongoose";

export class TestDbHelper {

    mongoServer: MongoMemoryServer;
    con: MongoClient;
    db: Db;
    uri: string;

    async start() {
        this.mongoServer = await MongoMemoryServer.create();
        this.uri = this.mongoServer.getUri();
        this.con = await MongoClient.connect(this.uri);
        this.db = this.con.db(this.mongoServer.instanceInfo!.dbName);
        return this.uri
    }

    async stop() {
        await this.con.close();
        return await this.mongoServer.stop();
    }

    async cleanup() {
        const collections = await this.db.listCollections().toArray();
        return Promise.all(
        collections
            .map(({ name }) => name)
            .map(collection => this.db.collection(collection).drop())
        );
    }
}