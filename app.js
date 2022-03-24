const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const instantiateDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

instantiateDbAndServer();
const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const convertDbToResponseObject = (obj) => {
  return {
    id: obj.id,
    todo: obj.todo,
    priority: obj.priority,
    status: obj.status,
  };
};

app.get("/todos/", async (request, response) => {
  let todoArray = null;
  let getTodosQuery = "";

  const { search_q = "", priority, status } = request.query;
  switch (true) {
    case hasPriorityAndStatus(request.query):
      getTodosQuery = `
        SELECT *
        FROM todo
        WHERE todo LIKE "%${search_q}%"
        AND priority = '${priority}' 
        AND status ='${status}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
        SELECT *
        FROM 
        todo
        WHERE
        todo LIKE '%${search_q}%' AND 
        priority ='${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
        SELECT *
        FROM 
        todo
        WHERE
        todo LIKE '%${search_q}%' AND 
        status ='${status}';`;
      break;
    default:
      getTodosQuery = `
        SELECT *
        FROM 
        todo
        WHERE
        todo LIKE '%${search_q}%';`;
  }
  todoArray = await db.all(getTodosQuery);
  response.send(todoArray);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
  SELECT *
  FROM 
  todo
  WHERE id='${todoId}';`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postTodoQuery = `
  INSERT INTO
  todo(id, todo, priority, status)
  VALUES(${id},'${todo}','${priority}','${status}');`;
  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const targetColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      targetColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      targetColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      targetColumn = "Todo";
      break;
  }
  const getPreviousTodoQuery = `
  SELECT *
  FROM 
  todo
  WHERE 
  id= ${todoId};`;
  const previousTodo = await db.get(getPreviousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
  UPDATE todo
  SET 
  todo = '${todo}',
  priority = '${priority}',
  status ='${status}'
  WHERE id= ${todoId};`;
  await db.run(updateTodoQuery);
  response.send(`${targetColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM
    todo
    WHERE 
    id= ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
