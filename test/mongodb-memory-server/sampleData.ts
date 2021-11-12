import { RepositoryDto, CreateRepositoryDto, RepositoryNameDto } from "../../src/github-api/model/Repository"
import { Diff, PullRequest, RepositoryFile, PullRequestFile, Releases, Issue, IssueEventTypes, IssueWithEvents, Labels, Assignee, Assignees, Milestones } from "src/github-api/model/PullRequest"
import { Label } from "../../src/database/schemas/labels.schema"


export class TestData {

    // test repo no. 1 
    getCreateRepo1(): CreateRepositoryDto {
        const repo = new CreateRepositoryDto
        repo.owner = "octkit"
        repo.repo = "rest.js"
        return repo
    }

    // test repo no. 2
    getCreateRepo2(): CreateRepositoryDto {
        const repo = new CreateRepositoryDto
        repo.owner = "octkit"
        repo.repo = "action.js"
        return repo
    }

    // test repo no. 1 repoDto
    getRepoDto1(): RepositoryDto {
        const repo = new RepositoryDto
        repo.owner = "octkit"
        repo.repo = "rest.js"
        return repo
    }

    // test repo no. 2 repoDto
    getRepoDto2(): RepositoryDto {
        const repo = new RepositoryDto
        repo.owner = "octkit"
        repo.repo = "action.js"
        return repo
    }

    // diffs for 2 pull requests for test repo no. 1
    // same files changed: package-lock.json (2x)
    // package.json, package-lock.json are changed together in one PR
    // pull request 1: 3 changed files
    // pull request 2: 2 changed files
    getDiffs1(): Diff[] {
        // first pull request
        const pullReq1: PullRequest = {
            url: "https://api.github.com/repos/octokit/action.js/pulls/5",
            title: "init version",
            base: {
                sha: "123",
                ref: "xyz",
                repo: {
                    default_branch: "main"
                }
            },
            number: 5
        }
        const repoFile1: RepositoryFile = {
            path: 'CODE_OF_CONDUCT.md',
            mode: '100644',
            type: 'blob',
            sha: 'cd02cdb91086a7e930ea61902f4bcd644d54e793',
            size: 3226,
            url: 'https://api.github.com/repos/octokit/rest.js/git/blobs/cd02cdb91086a7e930ea61902f4bcd644d54e793'
        }
        const repoFile1_1: RepositoryFile = {
            path: 'docs/src/components/template.js',
            mode: '100644',
            type: 'blob',
            sha: 'd2db58e4e9671ea66202334d586625b54b81ef6e',
            size: 1728,
            url: 'https://api.github.com/repos/octokit/rest.js/git/blobs/d2db58e4e9671ea66202334d586625b54b81ef6e'
        }
        const pullReqFile1: PullRequestFile = {
            sha: '5c6e897f38971591c0bfa1b32695dd924c638f07',
            filename: 'package-lock.json',
            status: 'added',
            additions: 26,
            deletions: 4,
            changes: 30,
            blob_url: 'https://github.com/octokit/rest.js/blob/371d9ece9073441ec5ff6d031730b859b973e07f/package-lock.json',
            raw_url: 'https://github.com/octokit/rest.js/raw/371d9ece9073441ec5ff6d031730b859b973e07f/package-lock.json',
            contents_url: 'https://api.github.com/repos/octokit/rest.js/contents/package-lock.json?ref=371d9ece9073441ec5ff6d031730b859b973e07f',
            patch: '@@ -1797,12 +1797,22 @@\n       "integrity": "sha512-4RFU4li238jMJAzLgAwkBAw+4Loile5haQMQr+uhFq27BmyJXcXSKvoQKqh0agsZEiUlW6iSv3FAgvmGkur7OQ=="\n     },\n     "@octokit/plugin-rest-endpoint-methods": {\n-      "version": "5.0.0",\n-      "resolved": "https://registry.npmjs.org/@octokit/plugin-rest-endpoint-methods/-/plugin-rest-endpoint-methods-5.0.0.tgz",\n-      "integrity": "sha512-Jc7CLNUueIshXT+HWt6T+M0sySPjF32mSFQAK7UfAg8qGeRI6OM1GSBxDLwbXjkqy2NVdnqCedJcP1nC785JYg==",\n+      "version": "5.0.1",\n+      "resolved": "https://registry.npmjs.org/@octokit/plugin-rest-endpoint-methods/-/plugin-rest-endpoint-methods-5.0.1.tgz",\n+      "integrity": "sha512-vvWbPtPqLyIzJ7A4IPdTl+8IeuKAwMJ4LjvmqWOOdfSuqWQYZXq2CEd0hsnkidff2YfKlguzujHs/reBdAx8Sg==",\n       "requires": {\n-        "@octokit/types": "^6.13.0",\n+        "@octokit/types": "^6.13.1",\n         "deprecation": "^2.3.1"\n+      },\n+      "dependencies": {\n+        "@octokit/types": {\n+          "version": "6.13.1",\n+          "resolved": "https://registry.npmjs.org/@octokit/types/-/types-6.13.1.tgz",\n+          "integrity": "sha512-UF/PL0y4SKGx/p1azFf7e6j9lB78tVwAFvnHtslzOJ6VipshYks74qm9jjTEDlCyaTmbhbk2h3Run5l0CtCF6A==",\n+          "requires": {\n+            "@octokit/openapi-types": "^6.0.0"\n+          }\n+        }\n       }\n     },\n     "@octokit/request": {\n@@ -1840,6 +1850,18 @@\n         "@octokit/plugin-paginate-rest": "^2.6.2",\n         "@octokit/plugin-request-log": "^1.0.2",\n         "@octokit/plugin-rest-endpoint-methods": "5.0.0"\n+      },\n+      "dependencies": {\n+        "@octokit/plugin-rest-endpoint-methods": {\n+          "version": "5.0.0",\n+          "resolved": "https://registry.npmjs.org/@octokit/plugin-rest-endpoint-methods/-/plugin-rest-endpoint-methods-5.0.0.tgz",\n+          "integrity": "sha512-Jc7CLNUueIshXT+HWt6T+M0sySPjF32mSFQAK7UfAg8qGeRI6OM1GSBxDLwbXjkqy2NVdnqCedJcP1nC785JYg==",\n+          "dev": true,\n+          "requires": {\n+            "@octokit/types": "^6.13.0",\n+            "deprecation": "^2.3.1"\n+          }\n+        }\n       }\n     },\n     "@octokit/types": {'
        }
        const pullReqFile1_1: PullRequestFile = {
            sha: 'b418caa06a8fb646e16052520292e81a455199e1',
            filename: 'package.json',
            status: 'added',
            additions: 1,
            deletions: 1,
            changes: 2,
            blob_url: 'https://github.com/octokit/rest.js/blob/371d9ece9073441ec5ff6d031730b859b973e07f/package.json',
            raw_url: 'https://github.com/octokit/rest.js/raw/371d9ece9073441ec5ff6d031730b859b973e07f/package.json',
            contents_url: 'https://api.github.com/repos/octokit/rest.js/contents/package.json?ref=371d9ece9073441ec5ff6d031730b859b973e07f',
            patch: '@@ -35,7 +35,7 @@\n     "@octokit/core": "^3.2.3",\n     "@octokit/plugin-paginate-rest": "^2.6.2",\n     "@octokit/plugin-request-log": "^1.0.2",\n-    "@octokit/plugin-rest-endpoint-methods": "5.0.0"\n+    "@octokit/plugin-rest-endpoint-methods": "5.0.1"\n   },\n   "devDependencies": {\n     "@octokit/auth": "^3.0.1",'        
        }
        const pullReqFile1_2: PullRequestFile = {
            sha: '4b5c6e08f39ff8bfd088d8462cf5ee91c25f4588',
            filename: 'test/smoke.test.ts',
            status: 'added',
            additions: 12,
            deletions: 0,
            changes: 12,
            blob_url: 'https://github.com/octokit/action.js/blob/0587c3a7b7357b51ff75c237013f7492f7a164d4/test/smoke.test.ts',
            raw_url: 'https://github.com/octokit/action.js/raw/0587c3a7b7357b51ff75c237013f7492f7a164d4/test/smoke.test.ts',
            contents_url: 'https://api.github.com/repos/octokit/action.js/contents/test/smoke.test.ts?ref=0587c3a7b7357b51ff75c237013f7492f7a164d4',
            patch: '@@ -0,0 +1,12 @@\n+// These environment variables to exist on import time\n+process.env.GITHUB_TOKEN = "secret123";\n+process.env.GITHUB_ACTION = "test";\n+\n+import { Octokit } from "../src";\n+\n+describe("Smoke test", () => {\n+  it("is a function", () => {\n+    expect(Octokit).toBeInstanceOf(Function);\n+    expect(() => new Octokit()).not.toThrow();\n+  });\n+});'
        }
        const pullReqDiff1: Diff = {
            pullRequest: pullReq1,
            repoFiles: [repoFile1, repoFile1_1],
            changedFiles: [pullReqFile1, pullReqFile1_1, pullReqFile1_2]
        }

        // second pull request
        const pullReq2: PullRequest = {
            url: "https://api.github.com/repos/octokit/action.js/pulls/133",
            title: "second version",
            base: {
                sha: "123",
                ref: "xyz",
                repo: {
                    default_branch: "main"
                }
            },
            number: 133
        }
        const repoFile2: RepositoryFile = {
            path: '.github/workflows/release.yml',
            mode: '100644',
            type: 'blob',
            sha: 'f754749a9ce2581c3c460c95b92d41e08d6b79dc',
            size: 440,
            url: 'https://api.github.com/repos/octokit/action.js/git/blobs/f754749a9ce2581c3c460c95b92d41e08d6b79dc'
        }
        const repoFile2_1: RepositoryFile = {
            path: '.github/workflows/test.yml',
            mode: '100644',
            type: 'blob',
            sha: 'f64d4bdd5a949b39593a12a0b4b6908ef10ae847',
            size: 408,
            url: 'https://api.github.com/repos/octokit/action.js/git/blobs/f64d4bdd5a949b39593a12a0b4b6908ef10ae847'
        }
        const repoFile2_2: RepositoryFile = {
            path: 'src/index.ts',
            mode: '100644',
            type: 'blob',
            sha: '6c8f804c41fe9b33d80f21117524543645a90f11',
            size: 260,
            url: 'https://api.github.com/repos/octokit/action.js/git/blobs/6c8f804c41fe9b33d80f21117524543645a90f11'
        }
        const pullReqFile2: PullRequestFile = {
            sha: '6b370c52746a8b6b5653cbd183b6f19289da83e0',
            filename: 'package-lock.json',
            status: 'added',
            additions: 116,
            deletions: 10,
            changes: 126,
            blob_url: 'https://github.com/octokit/action.js/blob/f2504fb2ae47473d1c060c6589ecc69f804745aa/package-lock.json',
            raw_url: 'https://github.com/octokit/action.js/raw/f2504fb2ae47473d1c060c6589ecc69f804745aa/package-lock.json',
            contents_url: 'https://api.github.com/repos/octokit/action.js/contents/package-lock.json?ref=f2504fb2ae47473d1c060c6589ecc69f804745aa',
            patch: '@@ -1,6 +1,6 @@\n {\n   "name": "@octokit/action",\n-  "version": "0.0.0-semantically-released",\n+  "version": "0.0.0-development",\n   "lockfileVersion": 1,\n   "requires": true,\n   "dependencies": {\n@@ -1110,14 +1110,64 @@\n       }\n     },\n     "@octokit/core": {\n-      "version": "1.2.0",\n-      "resolved": "https://registry.npmjs.org/@octokit/core/-/core-1.2.0.tgz",\n-      "integrity": "sha512-Yr1wfnN/BBNiMw8Zajc2Z2+h9PQ05D5R/fyKVKDWoFvJNVR9SB5lefQYNPbVowNznCSv3ZEE9V/MdDR3YrmqBQ==",\n+      "version": "2.0.0",\n+      "resolved": "https://registry.npmjs.org/@octokit/core/-/core-2.0.0.tgz",\n+      "integrity": "sha512-FLeqvRomhlcHFw53lpAYp26K5sRdXGRcN8V6zWSxVMzEdASP+ryA6iPjPCH7ylZvJxK2US90iLCH4IV+XmgJcQ==",\n       "requires": {\n-        "@octokit/graphql": "^4.2.0",\n-        "@octokit/request": "^5.1.0",\n+        "@octokit/auth-token": "^2.4.0",\n+        "@octokit/graphql": "^4.3.1",\n+        "@octokit/request": "^5.3.1",\n+        "@octokit/types": "^2.0.0",\n         "before-after-hook": "^2.1.0",\n         "universal-user-agent": "^4.0.0"\n+      },\n+      "dependencies": {\n+        "@octokit/auth-token": {\n+          "version": "2.4.0",\n+          "resolved": "https://registry.npmjs.org/@octokit/auth-token/-/auth-token-2.4.0.tgz",\n+          "integrity": "sha512-eoOVMjILna7FVQf96iWc3+ZtE/ZT6y8ob8ZzcqKY1ibSQCnu4O/B7pJvzMx5cyZ/RjAff6DAdEb0O0Cjcxidkg==",\n+          "requires": {\n+            "@octokit/types": "^2.0.0"\n+          }\n+        },\n+        "@octokit/endpoint": {\n+          "version": "5.5.1",\n+          "resolved": "https://registry.npmjs.org/@octokit/endpoint/-/endpoint-5.5.1.tgz",\n+          "integrity": "sha512-nBFhRUb5YzVTCX/iAK1MgQ4uWo89Gu0TH00qQHoYRCsE12dWcG1OiLd7v2EIo2+tpUKPMOQ62QFy9hy9Vg2ULg==",\n+          "requires": {\n+            "@octokit/types": "^2.0.0",\n+            "is-plain-object": "^3.0.0",\n+            "universal-user-agent": "^4.0.0"\n+          }\n+        },\n+        "@octokit/request": {\n+          "version": "5.3.1",\n+          "resolved": "https://registry.npmjs.org/@octokit/request/-/request-5.3.1.tgz",\n+          "integrity": "sha512-5/X0AL1ZgoU32fAepTfEoggFinO3rxsMLtzhlUX+RctLrusn/CApJuGFCd0v7GMFhF+8UiCsTTfsu7Fh1HnEJg==",\n+          "requires": {\n+            "@octokit/endpoint": "^5.5.0",\n+            "@octokit/request-error": "^1.0.1",\n+            "@octokit/types": "^2.0.0",\n+            "deprecation": "^2.0.0",\n+            "is-plain-object": "^3.0.0",\n+            "node-fetch": "^2.3.0",\n+            "once": "^1.4.0",\n+            "universal-user-agent": "^4.0.0"\n+          }\n+        },\n+        "is-plain-object": {\n+          "version": "3.0.0",\n+          "resolved": "https://registry.npmjs.org/is-plain-object/-/is-plain-object-3.0.0.tgz",\n+          "integrity": "sha512-tZIpofR+P05k8Aocp7UI/2UTa9lTJSebCXpFFoR9aibpokDj/uXBsJ8luUu0tTVYKkMU6URDUuOfJZ7koewXvg==",\n+          "requires": {\n+            "isobject": "^4.0.0"\n+          }\n+        },\n+        "isobject": {\n+          "version": "4.0.0",\n+          "resolved": "https://registry.npmjs.org/isobject/-/isobject-4.0.0.tgz",\n+          "integrity": "sha512-S/2fF5wH8SJA/kmwr6HYhK/RI/OkhD84k8ntalo0iJjZikgq1XFvR5M8NPT1x5F7fBwCG3qHfnzeP/Vh/ZxCUA=="\n+        }\n       }\n     },\n     "@octokit/endpoint": {\n@@ -1145,12 +1195,53 @@\n       }\n     },\n     "@octokit/graphql": {\n-      "version": "4.2.0",\n-      "resolved": "https://registry.npmjs.org/@octokit/graphql/-/graphql-4.2.0.tgz",\n-      "integrity": "sha512-6JKVE2cJPZVIM1LLsy7M4rKcaE3r6dbP7o895FLEpClHeMDv1a+k3yANue0ycMhM1Es9/WEy8hjBaBpOBETw6A==",\n+      "version": "4.3.1",\n+      "resolved": "https://registry.npmjs.org/@octokit/graphql/-/graphql-4.3.1.tgz",\n+      "integrity": "sha512-hCdTjfvrK+ilU2keAdqNBWOk+gm1kai1ZcdjRfB30oA3/T6n53UVJb7w0L5cR3/rhU91xT3HSqCd+qbvH06yxA==",\n       "requires": {\n-        "@octokit/request": "^5.0.0",\n+        "@octokit/request": "^5.3.0",\n+        "@octokit/types": "^2.0.0",\n         "universal-user-agent": "^4.0.0"\n+      },\n+      "dependencies": {\n+        "@octokit/endpoint": {\n+          "version": "5.5.1",\n+          "resolved": "https://registry.npmjs.org/@octokit/endpoint/-/endpoint-5.5.1.tgz",\n+          "integrity": "sha512-nBFhRUb5YzVTCX/iAK1MgQ4uWo89Gu0TH00qQHoYRCsE12dWcG1OiLd7v2EIo2+tpUKPMOQ62QFy9hy9Vg2ULg==",\n+          "requires": {\n+            "@octokit/types": "^2.0.0",\n+            "is-plain-object": "^3.0.0",\n+            "universal-user-agent": "^4.0.0"\n+          }\n+        },\n+        "@octokit/request": {\n+          "version": "5.3.1",\n+          "resolved": "https://registry.npmjs.org/@octokit/request/-/request-5.3.1.tgz",\n+          "integrity": "sha512-5/X0AL1ZgoU32fAepTfEoggFinO3rxsMLtzhlUX+RctLrusn/CApJuGFCd0v7GMFhF+8UiCsTTfsu7Fh1HnEJg==",\n+          "requires": {\n+            "@octokit/endpoint": "^5.5.0",\n+            "@octokit/request-error": "^1.0.1",\n+            "@octokit/types": "^2.0.0",\n+            "deprecation": "^2.0.0",\n+            "is-plain-object": "^3.0.0",\n+            "node-fetch": "^2.3.0",\n+            "once": "^1.4.0",\n+            "universal-user-agent": "^4.0.0"\n+          }\n+        },\n+        "is-plain-object": {\n+          "version": "3.0.0",\n+          "resolved": "https://registry.npmjs.org/is-plain-object/-/is-plain-object-3.0.0.tgz",\n+          "integrity": "sha512-tZIpofR+P05k8Aocp7UI/2UTa9lTJSebCXpFFoR9aibpokDj/uXBsJ8luUu0tTVYKkMU6URDUuOfJZ7koewXvg==",\n+          "requires": {\n+            "isobject": "^4.0.0"\n+          }\n+        },\n+        "isobject": {\n+          "version": "4.0.0",\n+          "resolved": "https://registry.npmjs.org/isobject/-/isobject-4.0.0.tgz",\n+          "integrity": "sha512-S/2fF5wH8SJA/kmwr6HYhK/RI/OkhD84k8ntalo0iJjZikgq1XFvR5M8NPT1x5F7fBwCG3qHfnzeP/Vh/ZxCUA=="\n+        }\n       }\n     },\n     "@octokit/request": {\n@@ -1211,6 +1302,21 @@\n         "universal-user-agent": "^4.0.0"\n       }\n     },\n+    "@octokit/types": {\n+      "version": "2.0.0",\n+      "resolved": "https://registry.npmjs.org/@octokit/types/-/types-2.0.0.tgz",\n+      "integrity": "sha512-467rp1g6YuxuNbu1m3A5BuGWxtzyVE8sAyN9+k3kb2LdnpmLPTiPsywbYmcckgfGZ+/AGpAaNrVx7131iSUXbQ==",\n+      "requires": {\n+        "@types/node": "^12.11.1"\n+      },\n+      "dependencies": {\n+        "@types/node": {\n+          "version": "12.12.5",\n+          "resolved": "https://registry.npmjs.org/@types/node/-/node-12.12.5.tgz",\n+          "integrity": "sha512-KEjODidV4XYUlJBF3XdjSH5FWoMCtO0utnhtdLf1AgeuZLOrRbvmU/gaRCVg7ZaQDjVf3l84egiY0mRNe5xE4A=="\n+        }\n+      }\n+    },\n     "@pika/babel-plugin-esm-import-rewrite": {\n       "version": "0.3.16",\n       "resolved": "https://registry.npmjs.org/@pika/babel-plugin-esm-import-rewrite/-/babel-plugin-esm-import-rewrite-0.3.16.tgz",'
        }
        const pullReqFile2_1: PullRequestFile = {
            sha: '7657210636cfad9c79bf6963fd0875b0063daa18',
            filename: 'src/index.ts',
            status: 'modified',
            additions: 1,
            deletions: 1,
            changes: 2,
            blob_url: 'https://github.com/octokit/action.js/blob/f2504fb2ae47473d1c060c6589ecc69f804745aa/src/index.ts',
            raw_url: 'https://github.com/octokit/action.js/raw/f2504fb2ae47473d1c060c6589ecc69f804745aa/src/index.ts',
            contents_url: 'https://api.github.com/repos/octokit/action.js/contents/src/index.ts?ref=f2504fb2ae47473d1c060c6589ecc69f804745aa',
            patch: '@@ -4,6 +4,6 @@ import { createActionAuth } from "@octokit/auth-action";\n import { VERSION } from "./version";\n \n export const Octokit = Core.defaults({\n-  auth: createActionAuth(),\n+  authStrategy: createActionAuth,\n   userAgent: `octokit-action.js/${VERSION}`\n });'
        }
        const pullReqDiff2: Diff = {
            pullRequest: pullReq2,
            repoFiles: [repoFile2, repoFile2_1, repoFile2_2],
            changedFiles: [pullReqFile2, pullReqFile2_1]
        }

        // store all pullReqDiffs in array and return them
        const pullReqDiffs: Diff[] = [
            pullReqDiff1, pullReqDiff2
        ]
        return pullReqDiffs;
    }

    // diffs for 3 pull requests for test repo no. 2
    // same files changed: .github/workflows/release.yml (2x)
    // same files changed: package-lock.json (3x)
    // same files changed: src/index.ts (2x)
    // unique file change: README.md (1x)
    // unique file change: test/smoke.test.ts (1x)
    // pull request 1: 4 changed files
    // pull request 2: 2 changed files
    // pull request 3: 3 changed files
    // 9 file changes in PRs at all, thereof are 5 files unique
    // => 9/5 = 1.8 => 5 files are changed in avg 1.8 times!
    getDiffs2(): Diff[] {
        // first pull request
        const pullReq1: PullRequest = {
            url: "https://api.github.com/repos/octokit/action.js/pulls/1",
            title: "init version",
            base: {
                sha: "123",
                ref: "xyz",
                repo: {
                    default_branch: "main"
                }
            },
            number: 1
        }
        const repoFile1: RepositoryFile = {
            path: "README.md",
            size: 132,
            type: "blob"
        }
        const repoFile1_1: RepositoryFile = {
            path: "LICENSE",
            size: 1077,
            sha: "c60e3f61b83bf65854d597104d4b42630110bffb",
            url: 'https://api.github.com/repos/octokit/action.js/git/blobs/c60e3f61b83bf65854d597104d4b42630110bffb',
            type: "blob"
        }
        const pullReqFile1: PullRequestFile = {
            sha: 'f754749a9ce2581c3c460c95b92d41e08d6b79dc',
            filename: '.github/workflows/release.yml',
            status: 'added',
            additions: 21,
            deletions: 0,
            changes: 21,
            blob_url: 'https://github.com/octokit/action.js/blob/0587c3a7b7357b51ff75c237013f7492f7a164d4/.github/workflows/release.yml',
            raw_url: 'https://github.com/octokit/action.js/raw/0587c3a7b7357b51ff75c237013f7492f7a164d4/.github/workflows/release.yml',
            contents_url: 'https://api.github.com/repos/octokit/action.js/contents/.github/workflows/release.yml?ref=0587c3a7b7357b51ff75c237013f7492f7a164d4',
            patch: '@@ -0,0 +1,21 @@\n+name: Release\n+on:\n+  push:\n+    branches:\n+      - master\n+\n+jobs:\n+  release:\n+    name: release\n+    runs-on: ubuntu-latest\n+    steps:\n+      - uses: actions/checkout@master\n+      - uses: actions/setup-node@v1\n+        with:\n+          node-version: "12.x"\n+      - run: npm ci\n+      - run: npm run build\n+      - run: npx semantic-release\n+        env:\n+          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}\n+          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}'
        }
        const pullReqFile1_1: PullRequestFile = {
            sha: 'a1ef5563a64f35a213a65e70e05253a20711be1e',
            filename: 'README.md',
            status: 'modified',
            additions: 83,
            deletions: 2,
            changes: 85,
            blob_url: 'https://github.com/octokit/action.js/blob/0587c3a7b7357b51ff75c237013f7492f7a164d4/README.md',
            raw_url: 'https://github.com/octokit/action.js/raw/0587c3a7b7357b51ff75c237013f7492f7a164d4/README.md',
            contents_url: 'https://api.github.com/repos/octokit/action.js/contents/README.md?ref=0587c3a7b7357b51ff75c237013f7492f7a164d4',
            patch: '@@ -1,5 +1,86 @@\n-# 🚧 WORK IN PROGRESS. See [#1](https://github.com/octokit/action.js/pull/1)\n-\n # action.js\n \n > GitHub API client for GitHub Actions\n+\n+[![@latest](https://img.shields.io/npm/v/@octokit/action.svg)](https://www.npmjs.com/package/@octokit/action)\n+[![Build Status](https://github.com/octokit/action.js/workflows/Test/badge.svg)](https://github.com/octokit/action.js/actions)\n+[![Greenkeeper](https://badges.greenkeeper.io/octokit/action.js.svg)](https://greenkeeper.io/)\n+\n+## Usage\n+\n+<table>\n+<tbody valign=top align=left>\n+<tr><th>\n+Browsers\n+</th><td width=100%>\n+\n+`@octokit/action` is not meant for browser usage.\n+\n+</td></tr>\n+<tr><th>\n+Node\n+</th><td>\n+\n+Install with `npm install @octokit/action`\n+\n+```js\n+const { Octokit } = require("@octokit/action");\n+// or: import { Octokit } from "@octokit/action";\n+```\n+\n+</td></tr>\n+</tbody>\n+</table>\n+\n+### Create an issue using REST API\n+\n+```js\n+const octokit = new Octokit();\n+const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");\n+\n+// See https://developer.github.com/v3/issues/#create-an-issue\n+const { data } = await octokit.request("POST /repos/:owner/:repo/issues", {\n+  owner,\n+  repo,\n+  title: "My test issue"\n+});\n+console.log("Issue created: %d", data.html_url);\n+```\n+\n+### Create an issue using GraphQL\n+\n+```js\n+const octokit = new Octokit();\n+const eventPayload = require(process.env.GITHUB_EVENT_PATH);\n+const repositoryId = eventPayload.repository.node_id;\n+\n+const response = await octokit.graphql(\n+  `\n+  mutation($repositoryId:ID!, $title:String!) {\n+    createIssue(input:{repositoryId: $repositoryId, title: $title}) {\n+      issue {\n+        number\n+      }\n+    }\n+  }\n+  `,\n+  {\n+    repositoryId,\n+    title: "My test issue"\n+  }\n+);\n+```\n+\n+### Hooks, plugins, and more\n+\n+`@octokit/action` is build upon `@octokit/core`. Refer to [its README](https://github.com/octokit/core.js#readme) for the full API documentation.\n+\n+## How it works\n+\n+`@octokit/action` is simply a [`@octokit/core`](https://github.com/octokit/core.js#readme) constructor, pre-authenticate using [`@octokit/auth-action](https://github.com/octokit/auth-action.js#readme).\n+\n+The source code is … simple: [`src/index.ts`](src/index.ts).\n+\n+## License\n+\n+[MIT](LICENSE)'
        }
        const pullReqFile1_2: PullRequestFile = {
            sha: '889f0691af807664b882af6887f7c4a209c7bef4',
            filename: 'package-lock.json',
            status: 'added',
            additions: 13749,
            deletions: 0,
            changes: 13749,
            blob_url: 'https://github.com/octokit/action.js/blob/0587c3a7b7357b51ff75c237013f7492f7a164d4/package-lock.json',
            raw_url: 'https://github.com/octokit/action.js/raw/0587c3a7b7357b51ff75c237013f7492f7a164d4/package-lock.json',
            contents_url: 'https://api.github.com/repos/octokit/action.js/contents/package-lock.json?ref=0587c3a7b7357b51ff75c237013f7492f7a164d4'
        }
        const pullReqFile1_3: PullRequestFile = {
            sha: '4b5c6e08f39ff8bfd088d8462cf5ee91c25f4588',
            filename: 'test/smoke.test.ts',
            status: 'added',
            additions: 12,
            deletions: 0,
            changes: 12,
            blob_url: 'https://github.com/octokit/action.js/blob/0587c3a7b7357b51ff75c237013f7492f7a164d4/test/smoke.test.ts',
            raw_url: 'https://github.com/octokit/action.js/raw/0587c3a7b7357b51ff75c237013f7492f7a164d4/test/smoke.test.ts',
            contents_url: 'https://api.github.com/repos/octokit/action.js/contents/test/smoke.test.ts?ref=0587c3a7b7357b51ff75c237013f7492f7a164d4',
            patch: '@@ -0,0 +1,12 @@\n+// These environment variables to exist on import time\n+process.env.GITHUB_TOKEN = "secret123";\n+process.env.GITHUB_ACTION = "test";\n+\n+import { Octokit } from "../src";\n+\n+describe("Smoke test", () => {\n+  it("is a function", () => {\n+    expect(Octokit).toBeInstanceOf(Function);\n+    expect(() => new Octokit()).not.toThrow();\n+  });\n+});'
        }
        const pullReqDiff1: Diff = {
            pullRequest: pullReq1,
            repoFiles: [repoFile1, repoFile1_1],
            changedFiles: [pullReqFile1, pullReqFile1_1, pullReqFile1_2, pullReqFile1_3]
        }

        // / second pull request
        const pullReq2: PullRequest = {
            url: "https://api.github.com/repos/octokit/action.js/pulls/2",
            title: "second version",
            base: {
                sha: "123",
                ref: "xyz",
                repo: {
                    default_branch: "main"
                }
            },
            number: 2
        }
        const repoFile2: RepositoryFile = {
            path: '.github/workflows/release.yml',
            mode: '100644',
            type: 'blob',
            sha: 'f754749a9ce2581c3c460c95b92d41e08d6b79dc',
            size: 440,
            url: 'https://api.github.com/repos/octokit/action.js/git/blobs/f754749a9ce2581c3c460c95b92d41e08d6b79dc'
        }
        const repoFile2_1: RepositoryFile = {
            path: '.github/workflows/test.yml',
            mode: '100644',
            type: 'blob',
            sha: 'f64d4bdd5a949b39593a12a0b4b6908ef10ae847',
            size: 408,
            url: 'https://api.github.com/repos/octokit/action.js/git/blobs/f64d4bdd5a949b39593a12a0b4b6908ef10ae847'
        }
        const repoFile2_2: RepositoryFile = {
            path: 'src/index.ts',
            mode: '100644',
            type: 'blob',
            sha: '6c8f804c41fe9b33d80f21117524543645a90f11',
            size: 260,
            url: 'https://api.github.com/repos/octokit/action.js/git/blobs/6c8f804c41fe9b33d80f21117524543645a90f11'
        }
        const pullReqFile2: PullRequestFile = {
            sha: '6b370c52746a8b6b5653cbd183b6f19289da83e0',
            filename: 'package-lock.json',
            status: 'added',
            additions: 116,
            deletions: 10,
            changes: 126,
            blob_url: 'https://github.com/octokit/action.js/blob/f2504fb2ae47473d1c060c6589ecc69f804745aa/package-lock.json',
            raw_url: 'https://github.com/octokit/action.js/raw/f2504fb2ae47473d1c060c6589ecc69f804745aa/package-lock.json',
            contents_url: 'https://api.github.com/repos/octokit/action.js/contents/package-lock.json?ref=f2504fb2ae47473d1c060c6589ecc69f804745aa',
            patch: '@@ -1,6 +1,6 @@\n {\n   "name": "@octokit/action",\n-  "version": "0.0.0-semantically-released",\n+  "version": "0.0.0-development",\n   "lockfileVersion": 1,\n   "requires": true,\n   "dependencies": {\n@@ -1110,14 +1110,64 @@\n       }\n     },\n     "@octokit/core": {\n-      "version": "1.2.0",\n-      "resolved": "https://registry.npmjs.org/@octokit/core/-/core-1.2.0.tgz",\n-      "integrity": "sha512-Yr1wfnN/BBNiMw8Zajc2Z2+h9PQ05D5R/fyKVKDWoFvJNVR9SB5lefQYNPbVowNznCSv3ZEE9V/MdDR3YrmqBQ==",\n+      "version": "2.0.0",\n+      "resolved": "https://registry.npmjs.org/@octokit/core/-/core-2.0.0.tgz",\n+      "integrity": "sha512-FLeqvRomhlcHFw53lpAYp26K5sRdXGRcN8V6zWSxVMzEdASP+ryA6iPjPCH7ylZvJxK2US90iLCH4IV+XmgJcQ==",\n       "requires": {\n-        "@octokit/graphql": "^4.2.0",\n-        "@octokit/request": "^5.1.0",\n+        "@octokit/auth-token": "^2.4.0",\n+        "@octokit/graphql": "^4.3.1",\n+        "@octokit/request": "^5.3.1",\n+        "@octokit/types": "^2.0.0",\n         "before-after-hook": "^2.1.0",\n         "universal-user-agent": "^4.0.0"\n+      },\n+      "dependencies": {\n+        "@octokit/auth-token": {\n+          "version": "2.4.0",\n+          "resolved": "https://registry.npmjs.org/@octokit/auth-token/-/auth-token-2.4.0.tgz",\n+          "integrity": "sha512-eoOVMjILna7FVQf96iWc3+ZtE/ZT6y8ob8ZzcqKY1ibSQCnu4O/B7pJvzMx5cyZ/RjAff6DAdEb0O0Cjcxidkg==",\n+          "requires": {\n+            "@octokit/types": "^2.0.0"\n+          }\n+        },\n+        "@octokit/endpoint": {\n+          "version": "5.5.1",\n+          "resolved": "https://registry.npmjs.org/@octokit/endpoint/-/endpoint-5.5.1.tgz",\n+          "integrity": "sha512-nBFhRUb5YzVTCX/iAK1MgQ4uWo89Gu0TH00qQHoYRCsE12dWcG1OiLd7v2EIo2+tpUKPMOQ62QFy9hy9Vg2ULg==",\n+          "requires": {\n+            "@octokit/types": "^2.0.0",\n+            "is-plain-object": "^3.0.0",\n+            "universal-user-agent": "^4.0.0"\n+          }\n+        },\n+        "@octokit/request": {\n+          "version": "5.3.1",\n+          "resolved": "https://registry.npmjs.org/@octokit/request/-/request-5.3.1.tgz",\n+          "integrity": "sha512-5/X0AL1ZgoU32fAepTfEoggFinO3rxsMLtzhlUX+RctLrusn/CApJuGFCd0v7GMFhF+8UiCsTTfsu7Fh1HnEJg==",\n+          "requires": {\n+            "@octokit/endpoint": "^5.5.0",\n+            "@octokit/request-error": "^1.0.1",\n+            "@octokit/types": "^2.0.0",\n+            "deprecation": "^2.0.0",\n+            "is-plain-object": "^3.0.0",\n+            "node-fetch": "^2.3.0",\n+            "once": "^1.4.0",\n+            "universal-user-agent": "^4.0.0"\n+          }\n+        },\n+        "is-plain-object": {\n+          "version": "3.0.0",\n+          "resolved": "https://registry.npmjs.org/is-plain-object/-/is-plain-object-3.0.0.tgz",\n+          "integrity": "sha512-tZIpofR+P05k8Aocp7UI/2UTa9lTJSebCXpFFoR9aibpokDj/uXBsJ8luUu0tTVYKkMU6URDUuOfJZ7koewXvg==",\n+          "requires": {\n+            "isobject": "^4.0.0"\n+          }\n+        },\n+        "isobject": {\n+          "version": "4.0.0",\n+          "resolved": "https://registry.npmjs.org/isobject/-/isobject-4.0.0.tgz",\n+          "integrity": "sha512-S/2fF5wH8SJA/kmwr6HYhK/RI/OkhD84k8ntalo0iJjZikgq1XFvR5M8NPT1x5F7fBwCG3qHfnzeP/Vh/ZxCUA=="\n+        }\n       }\n     },\n     "@octokit/endpoint": {\n@@ -1145,12 +1195,53 @@\n       }\n     },\n     "@octokit/graphql": {\n-      "version": "4.2.0",\n-      "resolved": "https://registry.npmjs.org/@octokit/graphql/-/graphql-4.2.0.tgz",\n-      "integrity": "sha512-6JKVE2cJPZVIM1LLsy7M4rKcaE3r6dbP7o895FLEpClHeMDv1a+k3yANue0ycMhM1Es9/WEy8hjBaBpOBETw6A==",\n+      "version": "4.3.1",\n+      "resolved": "https://registry.npmjs.org/@octokit/graphql/-/graphql-4.3.1.tgz",\n+      "integrity": "sha512-hCdTjfvrK+ilU2keAdqNBWOk+gm1kai1ZcdjRfB30oA3/T6n53UVJb7w0L5cR3/rhU91xT3HSqCd+qbvH06yxA==",\n       "requires": {\n-        "@octokit/request": "^5.0.0",\n+        "@octokit/request": "^5.3.0",\n+        "@octokit/types": "^2.0.0",\n         "universal-user-agent": "^4.0.0"\n+      },\n+      "dependencies": {\n+        "@octokit/endpoint": {\n+          "version": "5.5.1",\n+          "resolved": "https://registry.npmjs.org/@octokit/endpoint/-/endpoint-5.5.1.tgz",\n+          "integrity": "sha512-nBFhRUb5YzVTCX/iAK1MgQ4uWo89Gu0TH00qQHoYRCsE12dWcG1OiLd7v2EIo2+tpUKPMOQ62QFy9hy9Vg2ULg==",\n+          "requires": {\n+            "@octokit/types": "^2.0.0",\n+            "is-plain-object": "^3.0.0",\n+            "universal-user-agent": "^4.0.0"\n+          }\n+        },\n+        "@octokit/request": {\n+          "version": "5.3.1",\n+          "resolved": "https://registry.npmjs.org/@octokit/request/-/request-5.3.1.tgz",\n+          "integrity": "sha512-5/X0AL1ZgoU32fAepTfEoggFinO3rxsMLtzhlUX+RctLrusn/CApJuGFCd0v7GMFhF+8UiCsTTfsu7Fh1HnEJg==",\n+          "requires": {\n+            "@octokit/endpoint": "^5.5.0",\n+            "@octokit/request-error": "^1.0.1",\n+            "@octokit/types": "^2.0.0",\n+            "deprecation": "^2.0.0",\n+            "is-plain-object": "^3.0.0",\n+            "node-fetch": "^2.3.0",\n+            "once": "^1.4.0",\n+            "universal-user-agent": "^4.0.0"\n+          }\n+        },\n+        "is-plain-object": {\n+          "version": "3.0.0",\n+          "resolved": "https://registry.npmjs.org/is-plain-object/-/is-plain-object-3.0.0.tgz",\n+          "integrity": "sha512-tZIpofR+P05k8Aocp7UI/2UTa9lTJSebCXpFFoR9aibpokDj/uXBsJ8luUu0tTVYKkMU6URDUuOfJZ7koewXvg==",\n+          "requires": {\n+            "isobject": "^4.0.0"\n+          }\n+        },\n+        "isobject": {\n+          "version": "4.0.0",\n+          "resolved": "https://registry.npmjs.org/isobject/-/isobject-4.0.0.tgz",\n+          "integrity": "sha512-S/2fF5wH8SJA/kmwr6HYhK/RI/OkhD84k8ntalo0iJjZikgq1XFvR5M8NPT1x5F7fBwCG3qHfnzeP/Vh/ZxCUA=="\n+        }\n       }\n     },\n     "@octokit/request": {\n@@ -1211,6 +1302,21 @@\n         "universal-user-agent": "^4.0.0"\n       }\n     },\n+    "@octokit/types": {\n+      "version": "2.0.0",\n+      "resolved": "https://registry.npmjs.org/@octokit/types/-/types-2.0.0.tgz",\n+      "integrity": "sha512-467rp1g6YuxuNbu1m3A5BuGWxtzyVE8sAyN9+k3kb2LdnpmLPTiPsywbYmcckgfGZ+/AGpAaNrVx7131iSUXbQ==",\n+      "requires": {\n+        "@types/node": "^12.11.1"\n+      },\n+      "dependencies": {\n+        "@types/node": {\n+          "version": "12.12.5",\n+          "resolved": "https://registry.npmjs.org/@types/node/-/node-12.12.5.tgz",\n+          "integrity": "sha512-KEjODidV4XYUlJBF3XdjSH5FWoMCtO0utnhtdLf1AgeuZLOrRbvmU/gaRCVg7ZaQDjVf3l84egiY0mRNe5xE4A=="\n+        }\n+      }\n+    },\n     "@pika/babel-plugin-esm-import-rewrite": {\n       "version": "0.3.16",\n       "resolved": "https://registry.npmjs.org/@pika/babel-plugin-esm-import-rewrite/-/babel-plugin-esm-import-rewrite-0.3.16.tgz",'
        }
        const pullReqFile2_1: PullRequestFile = {
            sha: '7657210636cfad9c79bf6963fd0875b0063daa18',
            filename: 'src/index.ts',
            status: 'modified',
            additions: 1,
            deletions: 1,
            changes: 2,
            blob_url: 'https://github.com/octokit/action.js/blob/f2504fb2ae47473d1c060c6589ecc69f804745aa/src/index.ts',
            raw_url: 'https://github.com/octokit/action.js/raw/f2504fb2ae47473d1c060c6589ecc69f804745aa/src/index.ts',
            contents_url: 'https://api.github.com/repos/octokit/action.js/contents/src/index.ts?ref=f2504fb2ae47473d1c060c6589ecc69f804745aa',
            patch: '@@ -4,6 +4,6 @@ import { createActionAuth } from "@octokit/auth-action";\n import { VERSION } from "./version";\n \n export const Octokit = Core.defaults({\n-  auth: createActionAuth(),\n+  authStrategy: createActionAuth,\n   userAgent: `octokit-action.js/${VERSION}`\n });'
        }
        const pullReqDiff2: Diff = {
            pullRequest: pullReq2,
            repoFiles: [repoFile2, repoFile2_1, repoFile2_2],
            changedFiles: [pullReqFile2, pullReqFile2_1]
        }

        // third pull request
        const pullReq3: PullRequest = {
            url: "https://api.github.com/repos/octokit/action.js/pulls/3",
            title: "third version",
            base: {
                sha: "123",
                ref: "xyz",
                repo: {
                    default_branch: "main"
                }
            },
            number: 3
        }
        const repoFile3: RepositoryFile = {
            path: '.github/workflows/update-prettier.yml',
            mode: '100644',
            type: 'blob',
            sha: '9034577f5d7bb111b716aba33df3ef6718d42c7b',
            size: 631,
            url: 'https://api.github.com/repos/octokit/action.js/git/blobs/9034577f5d7bb111b716aba33df3ef6718d42c7b'
        }
        const repoFile3_1: RepositoryFile = {
            path: '.github/workflows/test.yml',
            mode: '100644',
            type: 'blob',
            sha: 'f64d4bdd5a949b39593a12a0b4b6908ef10ae847',
            size: 408,
            url: 'https://api.github.com/repos/octokit/action.js/git/blobs/f64d4bdd5a949b39593a12a0b4b6908ef10ae847'
        }
        const repoFile3_2: RepositoryFile = {
            path: 'src/index.ts',
            mode: '100644',
            type: 'blob',
            sha: '6c8f804c41fe9b33d80f21117524543645a90f11',
            size: 260,
            url: 'https://api.github.com/repos/octokit/action.js/git/blobs/6c8f804c41fe9b33d80f21117524543645a90f11'
        }
        const pullReqFile3: PullRequestFile = {
            sha: '6b370c52746a8b6b5653cbd183b6f19289da83e0',
            filename: 'package-lock.json',
            status: 'added',
            additions: 116,
            deletions: 10,
            changes: 126,
            blob_url: 'https://github.com/octokit/action.js/blob/f2504fb2ae47473d1c060c6589ecc69f804745aa/package-lock.json',
            raw_url: 'https://github.com/octokit/action.js/raw/f2504fb2ae47473d1c060c6589ecc69f804745aa/package-lock.json',
            contents_url: 'https://api.github.com/repos/octokit/action.js/contents/package-lock.json?ref=f2504fb2ae47473d1c060c6589ecc69f804745aa',
            patch: '@@ -1,6 +1,6 @@\n {\n   "name": "@octokit/action",\n-  "version": "0.0.0-semantically-released",\n+  "version": "0.0.0-development",\n   "lockfileVersion": 1,\n   "requires": true,\n   "dependencies": {\n@@ -1110,14 +1110,64 @@\n       }\n     },\n     "@octokit/core": {\n-      "version": "1.2.0",\n-      "resolved": "https://registry.npmjs.org/@octokit/core/-/core-1.2.0.tgz",\n-      "integrity": "sha512-Yr1wfnN/BBNiMw8Zajc2Z2+h9PQ05D5R/fyKVKDWoFvJNVR9SB5lefQYNPbVowNznCSv3ZEE9V/MdDR3YrmqBQ==",\n+      "version": "2.0.0",\n+      "resolved": "https://registry.npmjs.org/@octokit/core/-/core-2.0.0.tgz",\n+      "integrity": "sha512-FLeqvRomhlcHFw53lpAYp26K5sRdXGRcN8V6zWSxVMzEdASP+ryA6iPjPCH7ylZvJxK2US90iLCH4IV+XmgJcQ==",\n       "requires": {\n-        "@octokit/graphql": "^4.2.0",\n-        "@octokit/request": "^5.1.0",\n+        "@octokit/auth-token": "^2.4.0",\n+        "@octokit/graphql": "^4.3.1",\n+        "@octokit/request": "^5.3.1",\n+        "@octokit/types": "^2.0.0",\n         "before-after-hook": "^2.1.0",\n         "universal-user-agent": "^4.0.0"\n+      },\n+      "dependencies": {\n+        "@octokit/auth-token": {\n+          "version": "2.4.0",\n+          "resolved": "https://registry.npmjs.org/@octokit/auth-token/-/auth-token-2.4.0.tgz",\n+          "integrity": "sha512-eoOVMjILna7FVQf96iWc3+ZtE/ZT6y8ob8ZzcqKY1ibSQCnu4O/B7pJvzMx5cyZ/RjAff6DAdEb0O0Cjcxidkg==",\n+          "requires": {\n+            "@octokit/types": "^2.0.0"\n+          }\n+        },\n+        "@octokit/endpoint": {\n+          "version": "5.5.1",\n+          "resolved": "https://registry.npmjs.org/@octokit/endpoint/-/endpoint-5.5.1.tgz",\n+          "integrity": "sha512-nBFhRUb5YzVTCX/iAK1MgQ4uWo89Gu0TH00qQHoYRCsE12dWcG1OiLd7v2EIo2+tpUKPMOQ62QFy9hy9Vg2ULg==",\n+          "requires": {\n+            "@octokit/types": "^2.0.0",\n+            "is-plain-object": "^3.0.0",\n+            "universal-user-agent": "^4.0.0"\n+          }\n+        },\n+        "@octokit/request": {\n+          "version": "5.3.1",\n+          "resolved": "https://registry.npmjs.org/@octokit/request/-/request-5.3.1.tgz",\n+          "integrity": "sha512-5/X0AL1ZgoU32fAepTfEoggFinO3rxsMLtzhlUX+RctLrusn/CApJuGFCd0v7GMFhF+8UiCsTTfsu7Fh1HnEJg==",\n+          "requires": {\n+            "@octokit/endpoint": "^5.5.0",\n+            "@octokit/request-error": "^1.0.1",\n+            "@octokit/types": "^2.0.0",\n+            "deprecation": "^2.0.0",\n+            "is-plain-object": "^3.0.0",\n+            "node-fetch": "^2.3.0",\n+            "once": "^1.4.0",\n+            "universal-user-agent": "^4.0.0"\n+          }\n+        },\n+        "is-plain-object": {\n+          "version": "3.0.0",\n+          "resolved": "https://registry.npmjs.org/is-plain-object/-/is-plain-object-3.0.0.tgz",\n+          "integrity": "sha512-tZIpofR+P05k8Aocp7UI/2UTa9lTJSebCXpFFoR9aibpokDj/uXBsJ8luUu0tTVYKkMU6URDUuOfJZ7koewXvg==",\n+          "requires": {\n+            "isobject": "^4.0.0"\n+          }\n+        },\n+        "isobject": {\n+          "version": "4.0.0",\n+          "resolved": "https://registry.npmjs.org/isobject/-/isobject-4.0.0.tgz",\n+          "integrity": "sha512-S/2fF5wH8SJA/kmwr6HYhK/RI/OkhD84k8ntalo0iJjZikgq1XFvR5M8NPT1x5F7fBwCG3qHfnzeP/Vh/ZxCUA=="\n+        }\n       }\n     },\n     "@octokit/endpoint": {\n@@ -1145,12 +1195,53 @@\n       }\n     },\n     "@octokit/graphql": {\n-      "version": "4.2.0",\n-      "resolved": "https://registry.npmjs.org/@octokit/graphql/-/graphql-4.2.0.tgz",\n-      "integrity": "sha512-6JKVE2cJPZVIM1LLsy7M4rKcaE3r6dbP7o895FLEpClHeMDv1a+k3yANue0ycMhM1Es9/WEy8hjBaBpOBETw6A==",\n+      "version": "4.3.1",\n+      "resolved": "https://registry.npmjs.org/@octokit/graphql/-/graphql-4.3.1.tgz",\n+      "integrity": "sha512-hCdTjfvrK+ilU2keAdqNBWOk+gm1kai1ZcdjRfB30oA3/T6n53UVJb7w0L5cR3/rhU91xT3HSqCd+qbvH06yxA==",\n       "requires": {\n-        "@octokit/request": "^5.0.0",\n+        "@octokit/request": "^5.3.0",\n+        "@octokit/types": "^2.0.0",\n         "universal-user-agent": "^4.0.0"\n+      },\n+      "dependencies": {\n+        "@octokit/endpoint": {\n+          "version": "5.5.1",\n+          "resolved": "https://registry.npmjs.org/@octokit/endpoint/-/endpoint-5.5.1.tgz",\n+          "integrity": "sha512-nBFhRUb5YzVTCX/iAK1MgQ4uWo89Gu0TH00qQHoYRCsE12dWcG1OiLd7v2EIo2+tpUKPMOQ62QFy9hy9Vg2ULg==",\n+          "requires": {\n+            "@octokit/types": "^2.0.0",\n+            "is-plain-object": "^3.0.0",\n+            "universal-user-agent": "^4.0.0"\n+          }\n+        },\n+        "@octokit/request": {\n+          "version": "5.3.1",\n+          "resolved": "https://registry.npmjs.org/@octokit/request/-/request-5.3.1.tgz",\n+          "integrity": "sha512-5/X0AL1ZgoU32fAepTfEoggFinO3rxsMLtzhlUX+RctLrusn/CApJuGFCd0v7GMFhF+8UiCsTTfsu7Fh1HnEJg==",\n+          "requires": {\n+            "@octokit/endpoint": "^5.5.0",\n+            "@octokit/request-error": "^1.0.1",\n+            "@octokit/types": "^2.0.0",\n+            "deprecation": "^2.0.0",\n+            "is-plain-object": "^3.0.0",\n+            "node-fetch": "^2.3.0",\n+            "once": "^1.4.0",\n+            "universal-user-agent": "^4.0.0"\n+          }\n+        },\n+        "is-plain-object": {\n+          "version": "3.0.0",\n+          "resolved": "https://registry.npmjs.org/is-plain-object/-/is-plain-object-3.0.0.tgz",\n+          "integrity": "sha512-tZIpofR+P05k8Aocp7UI/2UTa9lTJSebCXpFFoR9aibpokDj/uXBsJ8luUu0tTVYKkMU6URDUuOfJZ7koewXvg==",\n+          "requires": {\n+            "isobject": "^4.0.0"\n+          }\n+        },\n+        "isobject": {\n+          "version": "4.0.0",\n+          "resolved": "https://registry.npmjs.org/isobject/-/isobject-4.0.0.tgz",\n+          "integrity": "sha512-S/2fF5wH8SJA/kmwr6HYhK/RI/OkhD84k8ntalo0iJjZikgq1XFvR5M8NPT1x5F7fBwCG3qHfnzeP/Vh/ZxCUA=="\n+        }\n       }\n     },\n     "@octokit/request": {\n@@ -1211,6 +1302,21 @@\n         "universal-user-agent": "^4.0.0"\n       }\n     },\n+    "@octokit/types": {\n+      "version": "2.0.0",\n+      "resolved": "https://registry.npmjs.org/@octokit/types/-/types-2.0.0.tgz",\n+      "integrity": "sha512-467rp1g6YuxuNbu1m3A5BuGWxtzyVE8sAyN9+k3kb2LdnpmLPTiPsywbYmcckgfGZ+/AGpAaNrVx7131iSUXbQ==",\n+      "requires": {\n+        "@types/node": "^12.11.1"\n+      },\n+      "dependencies": {\n+        "@types/node": {\n+          "version": "12.12.5",\n+          "resolved": "https://registry.npmjs.org/@types/node/-/node-12.12.5.tgz",\n+          "integrity": "sha512-KEjODidV4XYUlJBF3XdjSH5FWoMCtO0utnhtdLf1AgeuZLOrRbvmU/gaRCVg7ZaQDjVf3l84egiY0mRNe5xE4A=="\n+        }\n+      }\n+    },\n     "@pika/babel-plugin-esm-import-rewrite": {\n       "version": "0.3.16",\n       "resolved": "https://registry.npmjs.org/@pika/babel-plugin-esm-import-rewrite/-/babel-plugin-esm-import-rewrite-0.3.16.tgz",'
        }
        const pullReqFile3_1: PullRequestFile = {
            sha: '7657210636cfad9c79bf6963fd0875b0063daa18',
            filename: 'src/index.ts',
            status: 'modified',
            additions: 1,
            deletions: 1,
            changes: 2,
            blob_url: 'https://github.com/octokit/action.js/blob/f2504fb2ae47473d1c060c6589ecc69f804745aa/src/index.ts',
            raw_url: 'https://github.com/octokit/action.js/raw/f2504fb2ae47473d1c060c6589ecc69f804745aa/src/index.ts',
            contents_url: 'https://api.github.com/repos/octokit/action.js/contents/src/index.ts?ref=f2504fb2ae47473d1c060c6589ecc69f804745aa',
            patch: '@@ -4,6 +4,6 @@ import { createActionAuth } from "@octokit/auth-action";\n import { VERSION } from "./version";\n \n export const Octokit = Core.defaults({\n-  auth: createActionAuth(),\n+  authStrategy: createActionAuth,\n   userAgent: `octokit-action.js/${VERSION}`\n });'
        }
        const pullReqFile3_2: PullRequestFile = {
            sha: 'f754749a9ce2581c3c460c95b92d41e08d6b79dc',
            filename: '.github/workflows/release.yml',
            status: 'added',
            additions: 21,
            deletions: 0,
            changes: 21,
            blob_url: 'https://github.com/octokit/action.js/blob/0587c3a7b7357b51ff75c237013f7492f7a164d4/.github/workflows/release.yml',
            raw_url: 'https://github.com/octokit/action.js/raw/0587c3a7b7357b51ff75c237013f7492f7a164d4/.github/workflows/release.yml',
            contents_url: 'https://api.github.com/repos/octokit/action.js/contents/.github/workflows/release.yml?ref=0587c3a7b7357b51ff75c237013f7492f7a164d4',
            patch: '@@ -0,0 +1,21 @@\n+name: Release\n+on:\n+  push:\n+    branches:\n+      - master\n+\n+jobs:\n+  release:\n+    name: release\n+    runs-on: ubuntu-latest\n+    steps:\n+      - uses: actions/checkout@master\n+      - uses: actions/setup-node@v1\n+        with:\n+          node-version: "12.x"\n+      - run: npm ci\n+      - run: npm run build\n+      - run: npx semantic-release\n+        env:\n+          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}\n+          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}'
        }
        const pullReqDiff3: Diff = {
            pullRequest: pullReq3,
            repoFiles: [repoFile3, repoFile3_1, repoFile3_2],
            changedFiles: [pullReqFile3, pullReqFile3_1, pullReqFile3_2]
        }

        // store all pullReqDiffs in array and return them
        const pullReqDiffs: Diff[] = [
            pullReqDiff1, pullReqDiff2, pullReqDiff3
        ]
        return pullReqDiffs;
    }

    // 6 releases for test repo no. 1
    getReleases1(): Releases[] {
        const release1: Releases = {
            url: 'https://api.github.com/repos/octokit/rest.js/releases/50990667',
            id: 50990667,
            node_id: 'RE_kwDOFWkwyc4DCg5L',
            name: 'v18.12.0',
            created_at: '2021-10-07T19:44:32Z',
            published_at: '2021-10-07T19:45:36Z'    
        }
        const release2: Releases = {
            url: 'https://api.github.com/repos/octokit/rest.js/releases/50584540',
            id: 50584540,
            node_id: 'RE_kwDOFWkwyc4DA9vc',
            name: 'v18.11.4',
            created_at: '2021-09-30T21:23:28Z',
            published_at: '2021-09-30T21:25:02Z'
        }
        const release3: Releases = {
            url: 'https://api.github.com/repos/octokit/rest.js/releases/50513820',
            id: 50513820,
            node_id: 'RE_kwDOFWkwyc4DAsec',
            name: 'v18.11.3',
            created_at: '2021-09-30T00:23:22Z',
            published_at: '2021-09-30T00:24:39Z'
        }
        const release4: Releases = {
            url: 'https://api.github.com/repos/octokit/rest.js/releases/50351498',
            id: 50351498,
            node_id: 'RE_kwDOFWkwyc4DAE2K',
            name: 'v18.11.2',
            created_at: '2021-09-27T20:55:56Z',
            published_at: '2021-09-27T20:57:29Z'
        }
        const release5: Releases = {
            url: 'https://api.github.com/repos/octokit/rest.js/releases/50232224',
            id: 50232224,
            node_id: 'RE_kwDOFWkwyc4C_nug',
            name: 'v18.11.1',
            created_at: '2021-09-24T20:20:51Z',
            published_at: '2021-09-24T20:22:29Z'
        }
        const release6: Releases = {
            url: 'https://api.github.com/repos/octokit/rest.js/releases/50081109',
            id: 50081109,
            node_id: 'RE_kwDOFWkwyc4C_C1V',
            name: 'v18.11.0',
            created_at: '2021-09-22T18:33:24Z',
            published_at: '2021-10-01T08:35:00Z',
        }
        const releases: Releases[] = [
            release1, release2, release3, release4, release5, release6
        ]
        return releases
    }
    
    // 2 releases for test repo no. 2
    getReleases2(): Releases[] {
        const release1: Releases = {
            url: 'https://api.github.com/repos/octokit/rest.js/releases/50990667',
            id: 50990667,
            node_id: 'RE_kwDOFWkwyc4DCg5L',
            name: 'v18.12.0',
            created_at: '2020-10-07T19:44:32Z',
            published_at: '2020-10-07T19:45:36Z'    
        }
        const release2: Releases = {
            url: 'https://api.github.com/repos/octokit/rest.js/releases/50584540',
            id: 50584540,
            node_id: 'RE_kwDOFWkwyc4DA9vc',
            name: 'v18.11.4',
            created_at: '2021-05-30T21:23:28Z',
            published_at: '2021-05-30T21:25:02Z'
        }
        const releases: Releases[] = [
            release1, release2
        ]
        return releases
    }

    // 4 issues for both test repos
    getIssues(): Issue[] {
        // closed and assigned
        const issue1: Issue = {
            labels: [
                {
                    id: 2925707840,
                    node_id: 'MDU6TGFiZWwyOTI1NzA3ODQw',
                    url: 'https://api.github.com/repos/octokit/rest.js/labels/support',
                    name: 'support',
                    color: 'ffd33d',
                    'default': false,
                    description: 'Question about usage'
                }
            ],
            id: 1011837373,
            number: 121,
            state: 'closed',
            node_id: 'I_kwDOFWkwyc48T2m9',
            assignee: {
                login: 'gr2m',
                id: 39992,
                node_id: 'MDQ6VXNlcjM5OTky',
                type: 'User',
                site_admin: false,
            },
            milestone: {
                id: 1002604,
                node_id: "MDk6TWlsZXN0b25lMTAwMjYwNA==",
                number: 1,
                state: "open",
                title: "v1.0",
                description: "Tracking milestone for version 1.0",
                open_issues: 4,
                closed_issues: 8,
                created_at: "2011-04-10T20:09:31Z",
                updated_at: "2014-03-03T18:58:10Z",
                closed_at: "2013-02-12T13:22:01Z",
                due_on: "2012-10-09T23:39:01Z"
            },
            created_at: '2021-09-15T07:49:07Z',
            updated_at: '2021-10-01T16:26:19Z',
            closed_at: '2021-10-01T09:00:26Z',
            title: 'Getting Error: Empty value for parameter \'tag\': undefined',
            locked: false
        }
        // closed but not assigned
        const issue2: Issue = {
            labels: [
                {
                    id: 2925707840,
                    node_id: 'MDU6TGFiZWwyOTI1NzA3ODQw',
                    url: 'https://api.github.com/repos/octokit/rest.js/labels/support',
                    name: 'support',
                    color: 'ffd33d',
                    'default': false,
                    description: 'Question about usage'
                }
            ],
            id: 1011837376,
            number: 122,
            state: 'closed',
            node_id: 'I_kwDOFWkwyc48T2m9',
            assignee: null,
            milestone: {
                id: 1002604,
                node_id: "MDk6TWlsZXN0b25lMTAwMjYwNA==",
                number: 1,
                state: "open",
                title: "v1.0",
                description: "Tracking milestone for version 1.0",
                open_issues: 4,
                closed_issues: 8,
                created_at: "2011-04-10T20:09:31Z",
                updated_at: "2014-03-03T18:58:10Z",
                closed_at: "2013-02-12T13:22:01Z",
                due_on: "2012-10-09T23:39:01Z"
            },
            created_at: '2021-09-30T07:49:07Z',
            updated_at: '2021-10-01T16:26:19Z',
            closed_at: '2021-10-01T09:00:26Z',
            title: 'Getting Error: Empty value for parameter \'tag\': undefined',
            locked: false
        }
        // assigend but still open
        const issue3: Issue = {
            labels: [
                {
                    id: 2925707840,
                    node_id: 'MDU6TGFiZWwyOTI1NzA3ODQw',
                    url: 'https://api.github.com/repos/octokit/rest.js/labels/support',
                    name: 'support',
                    color: 'ffd33d',
                    'default': false,
                    description: 'Question about usage'
                }
            ],
            id: 101183737366,
            number: 123,
            state: 'open',
            node_id: 'I_kwDOFWkwyc48T2m9',
            assignee: {
                login: 'gr2m',
                id: 39992,
                node_id: 'MDQ6VXNlcjM5OTky',
                type: 'User',
                site_admin: false,
            },
            milestone: {
                id: 1002604,
                node_id: "MDk6TWlsZXN0b25lMTAwMjYwNA==",
                number: 1,
                state: "open",
                title: "v1.0",
                description: "Tracking milestone for version 1.0",
                open_issues: 4,
                closed_issues: 8,
                created_at: "2011-04-10T20:09:31Z",
                updated_at: "2014-03-03T18:58:10Z",
                closed_at: "2013-02-12T13:22:01Z",
                due_on: "2012-10-09T23:39:01Z"
            },
            created_at: '2021-09-30T07:49:07Z',
            updated_at: '2021-10-01T16:26:19Z',
            closed_at: null,
            title: 'Getting Error: Empty value for parameter \'tag\': undefined',
            locked: false
        }
        // closed and assigned
        const issue4: Issue = {
            labels: [
                {
                    id: 2925707840,
                    node_id: 'MDU6TGFiZWwyOTI1NzA3ODQw',
                    url: 'https://api.github.com/repos/octokit/rest.js/labels/support',
                    name: 'support',
                    color: 'ffd33d',
                    'default': false,
                    description: 'Question about usage'
                }
            ],
            id: 101183732323,
            number: 124,
            state: 'closed',
            node_id: 'I_kwDOFWkwyc48T2m9',
            assignee: {
                login: 'gr2m',
                id: 39992,
                node_id: 'MDQ6VXNlcjM5OTky',
                type: 'User',
                site_admin: false,
            },
            milestone: {
                id: 1002604,
                node_id: "MDk6TWlsZXN0b25lMTAwMjYwNA==",
                number: 1,
                state: "open",
                title: "v1.0",
                description: "Tracking milestone for version 1.0",
                open_issues: 4,
                closed_issues: 8,
                created_at: "2011-04-10T20:09:31Z",
                updated_at: "2014-03-03T18:58:10Z",
                closed_at: "2013-02-12T13:22:01Z",
                due_on: "2012-10-09T23:39:01Z"
            },
            created_at: '2021-09-30T07:49:07Z',
            updated_at: '2021-10-01T16:26:19Z',
            closed_at: '2021-10-01T09:00:26Z',
            title: 'Getting Error: Empty value for parameter \'tag\': undefined',
            locked: false
        }
        const issues: Issue[] = [issue1, issue2, issue3, issue4]
        return issues
    }
}