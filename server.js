'use strict';

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();
app.use(express.json());

const ID_RE = /^[a-f\d]{24}$/i;
const isId = (value) => typeof value === 'string' && ID_RE.test(value);

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  pendingTasks: { type: [String], default: [] },
  dateCreated: { type: Date, default: Date.now }
}, { versionKey: false });

const taskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  deadline: { type: Date, required: true },
  completed: { type: Boolean, default: false },
  assignedUser: { type: String, default: '' },
  assignedUserName: { type: String, default: 'unassigned' },
  dateCreated: { type: Date, default: Date.now }
}, { versionKey: false });

const User = mongoose.model('User', userSchema, 'users');
const Task = mongoose.model('Task', taskSchema, 'tasks');

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const bad = (message) => { throw new ApiError(400, message); };
const missing = (message) => { throw new ApiError(404, message); };
const ok = (res, data, status = 200, message = 'OK') =>
  res.status(status).json({ message, data });

function requireObject(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    bad('Request body must be a JSON object.');
  }
}
function requiredString(body, field) {
  if (typeof body[field] !== 'string' || !body[field].trim()) {
    bad(`${field} must be a non-empty string.`);
  }
  return body[field].trim();
}
function optionalString(body, field, fallback) {
  if (!Object.prototype.hasOwnProperty.call(body, field)) return fallback;
  if (typeof body[field] !== 'string') bad(`${field} must be a string.`);
  return body[field];
}
function readUserBody(body) {
  requireObject(body);
  const name = requiredString(body, 'name');
  const email = requiredString(body, 'email');
  const ids = body.pendingTasks === undefined ? [] : body.pendingTasks;
  if (!Array.isArray(ids) || !ids.every(isId)) {
    bad('pendingTasks must be an array of valid task IDs.');
  }
  return { name, email, pendingTasks: [...new Set(ids.map(id => id.toLowerCase()))] };
}
function readTaskBody(body) {
  requireObject(body);
  const name = requiredString(body, 'name');
  const description = optionalString(body, 'description', '');
  const completed = body.completed === undefined ? false : body.completed;
  if (typeof completed !== 'boolean') bad('completed must be a boolean.');
  if (typeof body.deadline !== 'string' || !body.deadline.trim()) {
    bad('deadline must be a valid date string.');
  }
  const deadline = new Date(body.deadline);
  if (!Number.isFinite(deadline.getTime())) bad('deadline must be a valid date.');
  const assignedUser = optionalString(body, 'assignedUser', '');
  if (assignedUser !== '' && !isId(assignedUser)) {
    bad('assignedUser must be a valid user ID or an empty string.');
  }
  const assignedUserName = optionalString(body, 'assignedUserName', undefined);
  if (assignedUser === '' && assignedUserName !== undefined && assignedUserName !== 'unassigned') {
    bad('An unassigned task must use assignedUserName "unassigned".');
  }
  return {
    name, description, deadline, completed,
    assignedUser: assignedUser.toLowerCase(), assignedUserName
  };
}

function parseObjectQuery(value, field) {
  if (value === undefined) return undefined;
  let parsed;
  try { parsed = JSON.parse(value); }
  catch (_) { bad(`${field} must contain valid JSON.`); }
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    bad(`${field} must be a JSON object.`);
  }
  return parsed;
}
function parseInteger(value, field) {
  if (value === undefined) return undefined;
  const n = Number(value);
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(n)) {
    bad(`${field} must be a non-negative integer.`);
  }
  return n;
}
function parseSelect(raw) {
  const select = parseObjectQuery(raw, 'select');
  if (select !== undefined) {
    for (const value of Object.values(select)) {
      if (value !== 0 && value !== 1) bad('select values must be 0 or 1.');
    }
    const values = Object.entries(select).filter(([field]) => field !== '_id').map(([, v]) => v);
    if (values.includes(0) && values.includes(1)) bad('Cannot mix include and exclude projections.');
  }
  return select;
}
function parseSort(raw) {
  const sort = parseObjectQuery(raw, 'sort');
  if (sort !== undefined && Object.values(sort).some(v => v !== 1 && v !== -1)) {
    bad('sort values must be 1 or -1.');
  }
  return sort;
}
function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
}
async function transaction(action) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => { result = await action(session); });
    return result;
  } finally {
    await session.endSession();
  }
}
async function existingById(Model, id, label, session) {
  if (!isId(id)) missing(`${label} not found.`);
  const doc = await Model.findById(id).session(session || null);
  if (!doc) missing(`${label} not found.`);
  return doc;
}
async function assertUniqueEmail(email, excludeUserId, session) {
  const existing = await User.findOne({ email }).session(session);
  if (existing && String(existing._id) !== String(excludeUserId || '')) {
    bad('A user with this email already exists.');
  }
}
async function verifyPendingTasks(taskIds, session) {
  if (!taskIds.length) return;
  const tasks = await Task.find({ _id: { $in: taskIds } }).session(session);
  if (tasks.some(t => t.completed)) bad('Completed tasks cannot be pendingTasks.');
  if (tasks.length !== taskIds.length) missing('One or more referenced tasks do not exist.');
}

async function synchronizeUser(user, newPending, session) {
  const userId = String(user._id);
  const newSet = new Set(newPending);
  await Task.updateMany(
    { assignedUser: userId, completed: false,
      _id: { $nin: newPending } },
    { $set: { assignedUser: '', assignedUserName: 'unassigned' } },
    { session }
  );
  await Task.updateMany(
    { assignedUser: userId },
    { $set: { assignedUserName: user.name } },
    { session }
  );
  if (newSet.size) {
    await User.updateMany(
      { _id: { $ne: user._id }, pendingTasks: { $in: newPending } },
      { $pull: { pendingTasks: { $in: newPending } } },
      { session }
    );
    await Task.updateMany(
      { _id: { $in: newPending } },
      { $set: { assignedUser: userId, assignedUserName: user.name } },
      { session }
    );
  }
}

async function resolveAssignee(taskBody, session) {
  if (!taskBody.assignedUser) return 'unassigned';
  const user = await User.findById(taskBody.assignedUser).session(session);
  if (!user) missing('Assigned user does not exist.');
  if (taskBody.assignedUserName !== undefined && taskBody.assignedUserName !== user.name) {
    bad('assignedUserName must match the assigned user name.');
  }
  return user.name;
}
async function synchronizeTask(task, session) {
  const taskId = String(task._id);
  await User.updateMany(
    { pendingTasks: taskId },
    { $pull: { pendingTasks: taskId } },
    { session }
  );
  if (task.assignedUser && !task.completed) {
    await User.updateOne(
      { _id: task.assignedUser },
      { $addToSet: { pendingTasks: taskId } },
      { session }
    );
  }
}

function collectionGet(Model, defaultLimit) {
  return asyncRoute(async (req, res) => {
    const where = parseObjectQuery(req.query.where, 'where') || {};
    const sort = parseSort(req.query.sort);
    const select = parseSelect(req.query.select);
    const skip = parseInteger(req.query.skip, 'skip') || 0;
    const specifiedLimit = parseInteger(req.query.limit, 'limit');
    const limit = specifiedLimit === undefined ? defaultLimit : specifiedLimit;
    if (req.query.count !== undefined && req.query.count !== 'true' && req.query.count !== 'false') {
      bad('count must be true or false.');
    }
    if (req.query.count === 'true') {
      return ok(res, await Model.countDocuments(where));
    }
    if (limit === 0) return ok(res, []);
    let query = Model.find(where);
    if (sort) query = query.sort(sort);
    if (select) query = query.select(select);
    if (skip) query = query.skip(skip);
    if (limit !== undefined) query = query.limit(limit);
    return ok(res, await query.exec());
  });
}
function itemGet(Model, label) {
  return asyncRoute(async (req, res) => {
    if (!isId(req.params.id)) missing(`${label} not found.`);
    const select = parseSelect(req.query.select);
    let query = Model.findById(req.params.id);
    if (select) query = query.select(select);
    const item = await query.exec();
    if (!item) missing(`${label} not found.`);
    return ok(res, item);
  });
}
app.get('/api/users', collectionGet(User, undefined));
app.get('/api/tasks', collectionGet(Task, 100));
app.get('/api/users/:id', itemGet(User, 'User'));
app.get('/api/tasks/:id', itemGet(Task, 'Task'));

app.post('/api/users', asyncRoute(async (req, res) => {
  const fields = readUserBody(req.body);
  const user = await transaction(async session => {
    await assertUniqueEmail(fields.email, undefined, session);
    await verifyPendingTasks(fields.pendingTasks, session);
    const doc = new User(fields);
    await doc.save({ session });
    await synchronizeUser(doc, fields.pendingTasks, session);
    return doc;
  });
  return ok(res, user, 201, 'User created successfully.');
}));
app.put('/api/users/:id', asyncRoute(async (req, res) => {
  const updated = await transaction(async session => {
    const user = await existingById(User, req.params.id, 'User', session);
    const fields = readUserBody(req.body);
    await assertUniqueEmail(fields.email, user._id, session);
    await verifyPendingTasks(fields.pendingTasks, session);
    user.name = fields.name;
    user.email = fields.email;
    user.pendingTasks = fields.pendingTasks;
    await user.save({ session });
    await synchronizeUser(user, fields.pendingTasks, session);
    return user;
  });
  return ok(res, updated, 200, 'User updated successfully.');
}));
app.post('/api/tasks', asyncRoute(async (req, res) => {
  const fields = readTaskBody(req.body);
  const task = await transaction(async session => {
    const assignedUserName = await resolveAssignee(fields, session);
    const doc = new Task({ ...fields, assignedUserName });
    await doc.save({ session });
    await synchronizeTask(doc, session);
    return doc;
  });
  return ok(res, task, 201, 'Task created successfully.');
}));
app.put('/api/tasks/:id', asyncRoute(async (req, res) => {
  const updated = await transaction(async session => {
    const task = await existingById(Task, req.params.id, 'Task', session);
    const fields = readTaskBody(req.body);
    const assignedUserName = await resolveAssignee(fields, session);
    task.name = fields.name;
    task.description = fields.description;
    task.deadline = fields.deadline;
    task.completed = fields.completed;
    task.assignedUser = fields.assignedUser;
    task.assignedUserName = assignedUserName;
    await task.save({ session });
    await synchronizeTask(task, session);
    return task;
  });
  return ok(res, updated, 200, 'Task updated successfully.');
}));
app.delete('/api/tasks/:id', asyncRoute(async (req, res) => {
  await transaction(async session => {
    const task = await existingById(Task, req.params.id, 'Task', session);
    await User.updateMany(
      { pendingTasks: String(task._id) },
      { $pull: { pendingTasks: String(task._id) } },
      { session }
    );
    await task.deleteOne({ session });
  });
  return res.status(204).end();
}));
app.delete('/api/users/:id', asyncRoute(async (req, res) => {
  await transaction(async session => {
    const user = await existingById(User, req.params.id, 'User', session);
    await Task.updateMany(
      { assignedUser: String(user._id) },
      { $set: { assignedUser: '', assignedUserName: 'unassigned' } },
      { session }
    );
    await user.deleteOne({ session });
  });
  return res.status(204).end();
}));

app.get('/', (req, res) => ok(res, { status: 'running' }, 200, 'API online.'));
app.use('/api', (req, res) => res.status(404).json({ message: 'Endpoint not found.', data: null }));

app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message, data: null });
  }
  if (err && err.code === 11000) {
    return res.status(400).json({ message: 'A user with this email already exists.', data: null });
  }
  if (err && (err.name === 'ValidationError' || err.name === 'CastError' ||
      err.name === 'StrictModeError' || err instanceof SyntaxError && 'body' in err)) {
    return res.status(400).json({ message: 'Invalid request data.', data: null });
  }
  console.error('Internal server error:', err);
  return res.status(500).json({ message: 'An unexpected server error occurred.', data: null });
});

const PORT = Number(process.env.PORT) || 3000;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DB_URI;
async function main() {
  if (!MONGODB_URI) throw new Error('Set MONGODB_URI in .env or your Render environment.');
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  await User.init();
  await Task.init();
  app.listen(PORT, '0.0.0.0', () => console.log(`API listening on port ${PORT}`));
}
if (require.main === module) {
  main().catch(err => { console.error('Startup failed:', err.message); process.exit(1); });
}
module.exports = { app, User, Task, main };