# MP #3: APIed Piper
### Due: Tuesday, Nov 3, 2026, 11:59PM CT

## Table of Contents
1. [Assignment](#1-assignment)
2. [Getting Started](#2-getting-started)
3. [Tips](#3-tips)
4. [Grading](#grading) and [Self-check](#self-check-with-submitjs)
5. [Rules](#rules)
6. [Submission Details](#submission-details)

## 1. Assignment

**The Basic Goal** : Create an API for a task management / todo list.

**The Fun Goal** : Imagine your hot new startup, Llama.io, is creating the best todo webapp on the market. You're competing in a crowded space with hot players like Asana, Wunderlist, Google Keep, etc, so your API has to be top-notch.

#### Task

 Implement an API with the following end-points (they would be preceded by something like http://localhost:3000/api/). Your implementation should use Node, Express and Mongoose.


| Endpoints| Actions | Intended Outcome                                    |
|----------|---------|-----------------------------------------------------|
| users    | GET     | Respond with a List of users                        |
|          | POST    | Create a new user. Respond with details of new user |
| users/:id| GET     | Respond with details of specified user or 404 error |
|          | PUT     | Replace entire user with supplied user or 404 error |
|          | DELETE  | Delete specified user or 404 error                  |
| tasks    | GET     | Respond with a List of tasks                        |
|          | POST    | Create a new task. Respond with details of new task |
| tasks/:id| GET    | Respond with details of specified task or 404 error  |
|          | PUT     | Replace entire task with supplied task or 404 error |
|          | DELETE  | Delete specified task or 404 error                  |

**NOTE**: In addition, the API has the following JSON encoded query string parameters for the GET requests to the `users` and `tasks` endpoints. You will also need to make sure the [+select+] parameter works for the `users/:id` and `tasks/:id` endpoints.:

| Parameter | Description                                                                                  |
|----------|----------------------------------------------------------------------------------------------|
| where    | filter results based on JSON query                                                           |
| sort     | specify the order in which to sort each specified field  (1- ascending; -1 - descending)     |
| select   | specify the set of fields to include or exclude in each document  (1 - include; 0 - exclude) |
| skip     | specify the number of results to skip in the result set; useful for pagination               |
| limit    | specify the number of results to return (default should be 100 for tasks and unlimited for users)                    |
| count    | if set to true, return the count of documents that match the query (instead of the documents themselves)                    |

Here are some example queries and what they would return:

| Query                                                                                | Description                                             |
|-----------------------------------------------------------------------------------------|---------------------------------------------------------|
| `http://localhost:3000/api/tasks`                          | Returns full list of  tasks                       |
| `http://localhost:3000/api/users`                          | Returns full list of users                       |
| `http://localhost:3000/api/users?where={"_id": "55099652e5993a350458b7b7"}`         | Returns a list with a single user with the specified ID ('_id' will be different). If nothing matches, it is still a success: `200` with an empty list |
| `http://localhost:3000/api/tasks?where={"completed": true}`                          | Returns a list of completed tasks                       |
| `http://localhost:3000/api/tasks?where={"_id": {"$in": ["59f930d6b1596b0cb3e82953","5a1b6d7bd72ba9106fe9239c"]}}` | Returns a set of tasks                                  |
| `http://localhost:3000/api/users?sort={"name": 1}`                                  | Returns a list of users sorted by name                  |
| `http://localhost:3000/api/users?select={"_id": 0}`                                  | Returns a list of users without the _id field           |
| `http://localhost:3000/api/tasks?skip=60&limit=20`                                   | Returns tasks number from 61 to 80                            |

**`/:id` vs `where`**: the two are different things. `GET /users/:id` and `GET /tasks/:id` look up one resource by its id and return `404` if it does not exist; only `select` applies to them (any other query parameter is ignored). `where`, `sort`, `skip`, `limit` and `count` apply to the collection endpoints (`GET /users`, `GET /tasks`), which always respond `200`, with an empty list (or a count of `0`) when nothing matches. An invalid JSON value in one of these parameters is a `400`.

**The API should be able to handle any combination of those parameters in a single request**. For example, the following is a valid GET request:

```javascript
http://localhost:3000/api/users?sort={"name": 1}&skip=60&limit=20
```

Here is the User Schema:

1. "name" - String
2. "email" - String
3. "pendingTasks" - [String] - The \_id fields of the *pending* tasks that this user has
4. "dateCreated" - Date - should be set automatically by server

Here is the Task Schema:

1. "name" - String
2. "description" - String
3. "deadline" - Date
4. "completed" - Boolean
5. "assignedUser" - String - The \_id field of the user this task is assigned to - default ""
6. "assignedUserName" - String - The name field of the user this task is assigned to - default "unassigned"
7. "dateCreated" - Date - should be set automatically by server to present date

**We assume that each task can be assigned only to one user.**

#### Requirements

1. Your database should be on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas). ***NOTE: Please add "Allow access from anywhere" to your cluster in the IP Whitelist*** (This is usually not a good practice in real use.) 

2. Responses from your API should be a JSON object with two fields. The first field should be named `message` and should contain a human readable String. The second field should be named `data` and should contain the actual JSON response object. For example, here is a valid response:

```javascript
{
    "message": "OK",
    "data": {
        "_id": "55099652e5993a350458b7b7",
        "email": "khandek2@illinois.edu",
        "name": "Sujay Khandekar"
    }
}
```

3. Error responses from your API should also also be a JSON object with a `message` and `data` fields. Messages have to sensible and human readable so that on the client side it can be displayed to the user. Also, it should be independent of the server side technology that you are using. For example, your API should not return an error message directly from Mongoose to the client.

4. Your API should respond with appropriate [HTTP status codes](http://www.restapitutorial.com/httpstatuscodes.html) for both successful and error responses. You should at least have the following codes: 200 (success), 201 (created), 204(no content), 400(bad request), 404 (not found), 500 (server error).

5. You should implement the query string functionality by using the methods provided by Mongoose (as opposed to querying Mongoose for all the results and then doing the filtering/sorting/skipping etc. in your Node/Express application code).

6. Have server side validation for:
    - Users cannot be created (or updated) without a name or email. All other fields that the user did not specify should be set to reasonable values.
    - Multiple users with the same email cannot exist.
    - Tasks cannot be created (or updated) without a name or a deadline. All other fields that the user did not specify should be set to reasonable values.

7. Your API should guarantee two-way reference between Task and User, see [Two-way references](#two-way-references) below.

#### Status codes for requests with a body (POST / PUT)

| Situation | Status |
|-----------|--------|
| Success: `POST` | `201` with the created resource in `data` |
| Success: `PUT` | `200` with the updated resource in `data` |
| `/:id` in the URL is not an existing resource (this includes ids that are not valid ObjectIds) | `404` |
| Missing/invalid required field (`name`, `email`, `deadline`) or a value of the wrong type | `400` |
| Email already used by another user | `400` |
| A task id in `pendingTasks` / a user id in `assignedUser` is not a valid id format | `400` |
| A task id in `pendingTasks` / a user id in `assignedUser` is a valid id but no such task/user exists | `404` |
| A completed task in `pendingTasks` | `400` |
| `assignedUserName` does not match the name of the user `assignedUser` | `400` |
| Anything unexpected (e.g. database failure) | `500`, with a message that does not leak Mongoose/MongoDB internals |

When several of these apply, check in this order: URL id (`404`), then field format and values (`400`), then whether the referenced tasks/users exist (`404`). Nothing may be changed in the database when a request fails.

#### Two-way references

A task is *pending* if it is not completed. Every pending task that is assigned to a user must be in that user's `pendingTasks`, and every id in a user's `pendingTasks` must be a pending task whose `assignedUser`/`assignedUserName` are that user's `_id`/`name`. An unassigned task has `assignedUser: ""` and `assignedUserName: "unassigned"`. How you keep these in sync is up to you, but the following must hold after every request.

**`PUT /users/:id`** replaces the user with `name`, `email` and `pendingTasks` (missing `pendingTasks` means an empty list). `dateCreated` never changes. Let `old` be the user's previous `pendingTasks` and `new` the requested list:

| Tasks | What happens |
|-------|--------------|
| in `old` but not in `new` | unassigned: `assignedUser = ""`, `assignedUserName = "unassigned"` |
| in `new` but not in `old` | assigned to this user: `assignedUser = <user _id>`, `assignedUserName = <user name>` |
| in `new` but currently assigned to another user | the task moves: it is removed from the other user's `pendingTasks`, then assigned to this user as above |
| already assigned to this user (completed ones too) | stay assigned; if the user's `name` changed, their `assignedUserName` is updated |

**`PUT /tasks/:id`** replaces the task (missing fields get their defaults; `dateCreated` never changes):
  - If the task is assigned (`assignedUser` is set), it is added to that user's `pendingTasks` unless `completed` is `true`; a completed task is removed from the user's `pendingTasks` but stays assigned to the user.
  - If `assignedUser` changed, the task is removed from the previous user's `pendingTasks`.
  - Setting `assignedUser` to `""` unassigns the task (`assignedUserName` becomes `"unassigned"`).
  - `assignedUser` and `assignedUserName` must refer to the same user (`400` otherwise; if `assignedUserName` is omitted you may fill it in). Changing `assignedUser` of an already **completed** task through `PUT` is allowed, since `PUT` replaces the whole task; the task is then simply assigned to the new user and is not added to anyone's `pendingTasks`.
  - Setting `completed` back to `false` on an assigned task makes it pending again (added to the user's `pendingTasks`).

**`POST /users`** with `pendingTasks` and **`POST /tasks`** with `assignedUser` follow the same rules as the corresponding `PUT`.

**`DELETE /tasks/:id`** removes the task from its assigned user's `pendingTasks`. **`DELETE /users/:id`** unassigns all of the user's tasks (including completed ones): `assignedUser = ""`, `assignedUserName = "unassigned"`.

## 2. Getting Started
1. Create a public repository under your own account on GitHub by clicking the `use this template` button on the top right.
2. Clone the repository you created to your local machine.
3. Use the current Node.js LTS (**Node 24**; check with `node -v`). Older and newer *non-LTS* versions (e.g. Node 25) are not supported. We recommend [nvm](https://github.com/nvm-sh/nvm): `nvm install --lts && nvm use --lts`.
4. Create your environment file from the template and fill in your MongoDB connection string:
`cp .env.example .env`
5. Install dependencies:
`npm install`
6. Uncomment the `mongoose.connect(...)` line in `server.js`, then start the dev server:
`npm start`
7. Deploy your API (see Tips) and check it with the autograder, see [Grading](#grading) and [Self-check with `submit.js`](#self-check-with-submitjs).



## 3. Tips
  - Start early!
  - Please DO NOT delete the `.gitignore` file from the project, you will lose 1% point
  - DO NOT push your `.env` file (it contains your database password) to your repository, or you will lose 1% point. `.env` is already listed in `.gitignore`; you only need to create it from `.env.example` (step 4 above). We will check that `.env` is not in your repository.
  - If you accidentally committed a `.env` file (e.g. one from an older template), stop tracking it with `git rm --cached .env`, then `git commit -m "Remove .env from version control"` and push. The file stays on your machine. **Anything you ever pushed is still in your git history, so also change your MongoDB database user's password.**
  - Check out [Postman](https://www.getpostman.com/postman) to your API
  - Free MongoDB server - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
  - In order for us to view and grade your MP, you will be deploying your APIs on Render. Refer to DevLab videos and [slides](https://drive.google.com/file/d/1PGC0QUjd8cxOZyS4aFkj45g7QYOF5dWD/view?usp=sharing) for a demo including setting up MongoDB, connecting Express.js and deploying on Render.


For answers to some popular questions see [FAQ.md](./FAQ.md).

## Grading

Your grade is determined by an autograder that sends HTTP requests to your **deployed** API (it cannot reach `localhost`) and checks the responses. Within each item, points are given for correct behavior and for the correct HTTP status code (roughly 75% / 25%). The exact test cases are not released, so test your API thoroughly, including unusual inputs and combinations of query parameters.

| Area | What is tested | Weight |
|------|----------------|--------|
| Creating & validating users and tasks | `POST` to `/users` and `/tasks` with valid and invalid data: response format, default values, status codes | 20% |
| `select` on single resources | `select` on `/users/:id` and `/tasks/:id` | 7.5% |
| Updating missing resources | `PUT` to `/users/:id` and `/tasks/:id` for ids that do not exist | 10% |
| Two-way references and consistency | Updating a task or a user keeps `assignedUser`, `assignedUserName` and `pendingTasks` consistent in both directions; inconsistent assignments are rejected | 27.5% |
| Query parameters | `where`, `sort`, `limit` and `count` on `GET /tasks` | 15% |
| Deleting | `DELETE` of tasks and users (response, status code) and fetching them afterwards | 20% |

Separately from the autograder score, the penalties listed in [Tips](#3-tips) (`.gitignore`, `.env`) apply. Your deployment needs to be up and connected to your database when your assignment is graded.

## Self-check with `submit.js`

1. Deploy your API on Render (and make sure it is connected to your Atlas database).
2. Open `submit.js` and set `API_URL` to your deployed URL (e.g. `https://my-mp3.onrender.com`). Do not change `AUTOGRADER_URL`.
3. Run `npm run submit` (requires Node 24 LTS).

You will see your score and, for every item that did not get full credit, feedback describing what went wrong. Notes:
  - A run takes a minute or more. If your Render service is asleep it needs to wake up first; if you get time-out errors, open your API URL in a browser, wait for it to respond, and try again.
  - The autograder is rate limited (about 5 runs per 2 minutes). Read the feedback and fix several issues before running again.
  - The autograder creates test users and tasks in your database and tries to delete them at the end. If your `DELETE` endpoints are broken, some test data may be left behind. Clean it up yourself.
  - `submit.js` does not submit your assignment; see Submission Details.

## Rules
1. This is an individual assignment. No collaboration is permitted.
2. It is not permitted to copy/paste code that is not your own. You are, however, free to look at different code sources for inspiration and clarity. All sources (code as well as reading material) that you reference to complete this assignment must be declared in the submission.
3. If you think something you’re doing might not be acceptable, please ask on Piazza.

## Submission Details
Fill out and submit the form [Submission Form](https://forms.gle/4V1v2VWU78XwM3H57). Running `submit.js` is only a self-check and is not a submission.

## Large Language Model Usage Policy

We acknowledge the transformative potential of Large Language Models (LLM) in generating code; however, we are still in the nascent stages of understanding how to embed LLMs in developer workflows to write code more efficiently while maintaining quality. Therefore, we will not be teaching students directly how to use LLMs to develop web applications.

As part of this class, we *do* encourage students to experiment with LLM services such as OpenAI's ChatGPT to generate source code for MPs. If LLMs are used to generate code for an MP, students *must* (1) submit their chatlogs along with their source code, and (2) answer survey questions related to their experience using LLMs in the grading form. Failure to do this will be a violation of the academic integrity policy of this course.
