## FAQ

Here are some answers to some popular questions from previous years.

### Lost In The Sauce?

* Where do I begin? 

    > I'm really confused on how to start or what to do for MP3?
    
    __Answer__: Please start by watching the dev lab recordings, as they often provide instructions on how to approach the MPs. Additionally, going through the class slides and recordings can give you a better understanding of the concepts. Lastly, ensure you thoroughly read through the MP3 instructions, as they are designed to guide you through the assignment. If after doing all these, you still have questions, please don't hesitate to reach out for further clarification. If you did all of that and are still confused, please join the next available office hours.

* Next Steps After Setting up MongoDB Cluster?

    > Confused on how to start. I've set up the mongodb cluster and everything but I don't know what to do next.

    __Answer__: The next step is to get the connection string. If you've set up the MongoDB cluster, Click on "Connect" to get the connection string. The connection string typically looks like:

    `mongodb+srv://username:password@link/test?retryWrites=true`

    Replace <username> and <password> with your __database__ username and password. The database credentials are not the login details for your MongoDB Atlas account.

* Testing?

    > How to check if my code is correct? Just NPM start? What else should i do to check if my code can pass the tests?

    __Answer__: Once you implemented all 4 endpoints, you can use tools like Postman to manually test your API routes. Ensure that all endpoints return the expected response and status codes. Inspect the data in your database to ensure that the data gets stored, updated, and deleted as intended based on your API actions.

    > users/:id GET Respond with details of specified user or 404 error \
    > PUT Replace entire user with supplied user or 404 error \
    > DELETE Delete specified user or 404 error \
    > \
    > I just wonder how I can give and check GET PUT and DELETE requests for both users and tasks from using URLs. or is there any other way for doing this?

    __Answer__: If you are asking how to test these endpoints and read through the data you send in and receive, I would recommend using Postman! It provides a clean interface for making HTTP requests. Otherwise, look up the documentation for curl and have fun :D

* How do I run the autograder?

    > Is there a way to see my score before the deadline?

    __Answer__: Yes. Deploy your API, set `API_URL` in `submit.js`, and run `npm run submit`. See "Self-check with `submit.js`" in the README. The autograder cannot reach `localhost`, so you must use your deployed URL.

* How do I read the autograder's feedback?

    > It says "FAIL" for an item but my Postman requests work.

    __Answer__: Each item that did not receive full credit lists what was wrong, e.g. a wrong status code, a missing field, or a broken two-way reference. We don't release the exact requests the autograder sends, so also try variations in Postman (invalid input, missing fields, combining query parameters, ids that do not exist). Items marked "Skipped" depend on an earlier item (e.g. creating a user) that failed, so fix that one first.

* `submit.js` times out or says "no response from server"

    __Answer__: A free Render service sleeps when idle and can take a minute or more to wake up. Open your API URL in a browser, wait for a response, and run again. Also check that your API URL is the base URL of your deployment (the autograder adds `/api` itself), that it is public, and that your MongoDB Atlas cluster allows access from anywhere.

* "Too many submissions"

    > I got a rate limit error from the autograder.

    __Answer__: The autograder allows a limited number of runs per student in a time window. Wait a few minutes, and fix multiple issues between runs.

* Is the `submit.js` score my final grade?

    __Answer__: It is the output of the same autograder used for grading, but running it is not a submission. Submit through the form in the README, and make sure your deployment stays up.


### Node.js and packages

1. Which Node.js version should I use? I get errors on Node 25.

    __Answer__: Use the current **LTS** release, Node 24 (`nvm install --lts && nvm use --lts`). The starter now uses current Mongoose (v9) and Express (v5), which work on Node 24 LTS; do not use odd-numbered, non-LTS releases such as Node 25. The old starter pinned Mongoose 5, which does not work on newer Node versions; if your `package.json` still says `"mongoose": "^5..."`, update it (or re-copy it from the template) and run `npm install`. With Mongoose 9 you do not need options like `useNewUrlParser`/`useUnifiedTopology`, just `mongoose.connect(process.env.MONGODB_URI)`, and callbacks are no longer supported (use `async`/`await` or promises).

### MongoDB Questions

1. MP3 Collection Constraints

    > In MP3, we will create two collections in our database, User and Task, and I notice there are some constraints. I wonder if we should enforce these constraints in the Schema defined by Mongoose, or we should enforce them in our backend server?

    __Answer__: "I wonder if we should enforce these constraints in the Schema defined by Mongoose" <-- this should be sufficient.

2. Mongoose timestamps

    > For the user and task schema, can we use the mongoose timestamps "createdAt" for the "dateCreated" field, or we have to manually create "dateCreated" filed and set accordingly.

    __Answer__: Yes, you can use Mongoose's built-in `timestamps`, e.g. `timestamps: { createdAt: 'dateCreated', updatedAt: false }` so the field is named `dateCreated`. Whichever way you do it, `dateCreated` must be set by the server when the document is created, must be ignored if a client sends it, and must not change on `PUT`.

3. Deprecated URL Warning
    ```
    I am getting this error: 

    (node:72912) [DEP0170] DeprecationWarning: The URL mongodb://<"username">:<"password">@ac-awddrux-shard-00-00.1xcdsnq.mongodb.net:27017,ac-awddrux-shard-00-01.1xcdsnq.mongodb.net:27017,ac-awddrux-shard-00-02.1xcdsnq.mongodb.net:27017/test?authSource=admin&replicaSet=atlas-6tfpfd-shard-0&retryWrites=true&ssl=true is invalid. Future versions of Node.js will throw an error.
    (Use `node --trace-deprecation ...` to show where the warning was created)

    When I look at http://localhost:4000/api on postman I am getting the correct response so I am unsure what this error means and how to fix it. Do I need to worry about this or is it fine as long as the link works like expected?
    ```

    __Answer__: If possible, switch to the newer SRV-style connection string provided by MongoDB Atlas. It's shorter and often recommended for newer applications. It typically looks like this:
    
    `mongodb+srv://username:password@your-cluster.mongodb.net/database`


### MP3 Project Clarifications

1. .env
    > In the .env file, other than the MONGODB_URI key, do we need to update the TOKEN key or we just leave it as what it is?

    __Answer__: The repository contains `.env.example`, not `.env`. Copy it (`cp .env.example .env`) and fill in `MONGODB_URI` with your own connection string; leave `TOKEN` as it is. `.env` is already in `.gitignore`, so it will not be committed. If you did commit a `.env` file, run `git rm --cached .env`, commit and push, and change your database password (see the README Tips).

2. Using external packages
    
    > Are we allowed to install other packages, such as Morgan to monitor the request?

    __Answer__: Yes, you can install additional packages like Morgan if they help with development and debugging. However, always ensure that any additional packages or tools you use do not conflict with the primary requirements of the project.

3. Conflicting Inputs MP3

    > Do we have to check if there is a conflict of assignment between tasks and users? For example, a task is assigned to user A (and is in A's pendingTasks), and then user B is updated (PUT) with that task's id in its pendingTasks. What should happen?

    __Answer__: This is not an error. `PUT` replaces the user, so the task *moves*: it is removed from A's `pendingTasks` and assigned to B (`assignedUser` = B's `_id`, `assignedUserName` = B's name). The same applies to `POST /users` with `pendingTasks`. A task is assigned to at most one user at any time. (Errors are only for invalid input: malformed ids `400`, non-existent tasks `404`, completed tasks `400`.) See the README section "Two-way references".

4. 404 Clarification

    > users/:id GET Respond with details of specified user or 404 error \
    > \
    > When `http://localhost:4000/api/users?where={"_id": "55099652e5993a350458b7b7"}` can't find a user, which do we give: 404 error message or `{"message":"OK","data":[]}`?

    __Answer__: These are two different endpoints with two different rules:
    * `GET /api/users/:id` (and `/api/tasks/:id`) looks up *one* resource. If it does not exist, or the id is not a valid id at all, respond `404`.
    * `GET /api/users?where=...` (and `/api/tasks?where=...`) returns a *list*. No match is not an error: respond `200` with `{"message":"OK","data":[]}` (or `0` with `count=true`). Do not return `404` here.

    (Earlier versions of this FAQ said a `where` with no match should return 404. That is no longer the rule.)

5. Cascade Updates

    > When implementing PUT for Task or User, do we have to make sure the other one gets updated as well?

    __Answer__: Yes. The complete rules are in the README section "Two-way references"; the cases people most often ask about are listed here. Let `old` be a user's previous `pendingTasks` and `new` the list in the `PUT /users/:id` body:

    | Case | Result |
    |------|--------|
    | tasks in `old` but not in `new` | `assignedUser = ""`, `assignedUserName = "unassigned"` |
    | tasks in `new` but not in `old` | `assignedUser = <user _id>`, `assignedUserName = <user name>` |
    | a task in `new` that belongs to another user | removed from the other user's `pendingTasks`, then assigned to this user |
    | the user's `name` changed | `assignedUserName` is updated on **all** the user's tasks (completed ones included) |
    | `PUT /tasks/:id` assigns an uncompleted task to a user | the task id is added to that user's `pendingTasks` |
    | `PUT /tasks/:id` changes `assignedUser` | the task id is removed from the previous user's `pendingTasks` |
    | `PUT /tasks/:id` with `completed: true` | removed from the user's `pendingTasks`, the task stays assigned to that user |
    | `PUT /tasks/:id` with `completed: false` and an assigned user | the task id is (re)added to that user's `pendingTasks` |
    | `PUT /tasks/:id` with `assignedUser: ""` | unassigned, and removed from the previous user's `pendingTasks` |
    | `DELETE /tasks/:id` | removed from the assigned user's `pendingTasks` |
    | `DELETE /users/:id` | all the user's tasks (completed too) become `""` / `"unassigned"` |

    Any approach that gives these results is fine, you are free to implement it more cleverly. Note that if your endpoint allows changing `pendingTasks`, it must also update the tasks that were added/removed, and if it allows changing a task's `assignedUser`, it must update the users' `pendingTasks`.

    > SCENARIO: PUT request to /api/tasks/:id but the Task is already assigned to a User. Should we always overwrite, or send an error?

    __Answer__: Always overwrite (`PUT` replaces the resource) and update the other documents so everything stays consistent. Errors are only for invalid input, see the next question. `DELETE` on an existing id always succeeds and cleans up references.

6. `PUT /users/:id`: what should the status codes be?

    __Answer__: In this order:

    | # | Situation | Response |
    |---|-----------|----------|
    | 1 | `:id` is not an existing user (including a malformed id) | `404` |
    | 2 | `name` or `email` missing / wrong type; a `pendingTasks` entry is not a valid id; `pendingTasks` is not a list | `400` |
    | 3 | `email` is used by *another* user (keeping the user's own email is fine) | `400` |
    | 4 | an id in `pendingTasks` is valid but no such task exists | `404` |
    | 5 | a task in `pendingTasks` is completed | `400` |
    | 6 | unexpected server/database error | `500` |
    | 7 | success | `200`, with the updated user (the new `pendingTasks`) in `data` |

    On success: `dateCreated` is unchanged, the tasks are updated as described above, and nothing is changed for failed requests. The same ideas apply to `PUT /tasks/:id` (`404` for an unknown task id, `400` for missing `name`/`deadline`, a malformed `assignedUser`, or an `assignedUserName` that does not match `assignedUser`, `404` for a well-formed `assignedUser` that does not exist).

    > Does the user's `pendingTasks` need to be a task that is not completed? If a task is created or updated with `completed` set to true, should it be added to the assigned user's `pendingTasks`?

    __Answer__: No. Completed tasks are never in `pendingTasks`, and a request that puts a completed task there gets `400`.

    > Can I change `assignedUser` (or `assignedUserName`) of a **completed** task with `PUT`?

    __Answer__: Yes, it is allowed. `PUT` replaces the whole task and the new assignment must still be valid (existing user, matching `assignedUserName`). Because the task is completed it is not added to anyone's `pendingTasks`. A completed task keeps its `assignedUser` (that is how we know who completed it), so e.g. `PUT` with `completed: true` and the same `assignedUser` must succeed and remove the task from the user's `pendingTasks`. If you set `completed` back to `false` the task becomes pending again for its assigned user.

7. Queries

    > "You will also need to make sure the select parameter works for the users/:id and tasks/:id endpoints.:" \
    > \
    > Does it mean we can have an API endpoint like this? \
    > \
    > http://localhost:4000/api/users/:1?where={"name": "web_prog"} \
    > \
    > Follow up questions what if userId 1 = "soemthing" and user with name "web_prog" has ID 5. What should we return in such case.

    __Answer__: Based on the requirements provided, when accessing the endpoints users/:id and tasks/:id, only the select parameter is required to function. All other parameters can be ignored for these specific endpoints. Thus, in the query:

    http://localhost:4000/api/users/:1?where={"name": "web_prog"}
    
    if someone is trying to access a specific user by ID, the ID is the only filter, and query parameters other than `select` are ignored (do not return an error for them).
    
    In the follow-up question, you should return the user with ID 1 since the:id filter is primary.

8. Error Handling
    ```
    In the mp instructions it is mentioned that:

    "Error responses from your API should also also be a JSON object with a message and data fields. Messages have to sensible and human readable so that on the client side it can be displayed to the user. Also, it should be independent of the server side technology that you are using. For example, your API should not return an error message directly from Mongoose to the client."

    "message" field should have some human readable string. What should the "data" field contain? Can it contain the actual error message?

    example:

    {
    "message": "Internal Server Error",
    "data": "Cast to ObjectId failed for value \"653b71db6097fe49e83f1e\" (type
    string) at path \"_id\" for model \"User\""
    }
    ```

    __Answer__: The "data" field can contain additional information regarding the error, but you should avoid sending detailed error messages, especially those generated directly from Mongoose. "Invalid ID format provided for User" could be an example.

    ```
    For users/:id and tasks/:id it is mentioned in the instructions to return 404 error in case the user or task is not found.

    If a valid _id is used in the query, but there is no user with that _id, then my API is returning 404 error:

    http://localhost:4000/api/users/:id 

    id - 653b71db6097fe49e83f1e94

    Status 404 Not Found

    {
    "message": "User Not Found",
    "data": "User not found."
    }
    But when I use some invalid _id like some random string, then I am getting this error:
    http://localhost:4000/api/users/:id
    id - fdsfdsfrwdsfc
    Status 500 Internal Server Error
    {
    "message": "Internal Server Error",
    "data": "Cast to ObjectId failed for value \"fdsfdsfrwdsfc\" (type string) at path \"_id\" for model \"User\""
    }
    How to deal with such cases? Should I return the above response or 404 response in case _id is invalid?
    ```

    __Answer__: For the `:id` in the URL (`/users/:id`, `/tasks/:id`), respond `404` both when the id is well-formed but nobody has it, and when it is not a valid id at all: from the client's point of view the resource does not exist, and a `500` would be wrong because it is not a server problem. Use a message such as "User not found".

    For ids that appear in the *request body* (`pendingTasks` entries, `assignedUser`) the distinction matters: a malformed id is a `400` (bad request), a well-formed id that does not exist is a `404`. See the status code table in the README.

### Submission Logistics

* Video Submission?

    > For MP3, do we submit a video along with the repo link? Asking to make surebecause I only see repo link and nothing else.

    __Answer__: No, you don't have to submit a video for MP3.

* MongoDB
    > Should we clean up and empty the database before making a submission?

    __Answer__: No, based on the requirements provided, you should not clean up and empty the database before making a submission. You do not need to populate it with any particular amount of data. Note that the autograder creates (and tries to delete) a few test users and tasks in your database when you run `submit.js`.
