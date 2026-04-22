CREATE TABLE todo_users (
    id UUID PRIMARY KEY,
    username VARCHAR(32) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_todo_users_username ON todo_users (username);
CREATE INDEX idx_todo_users_email ON todo_users (email);

CREATE TABLE todo_tasks (
    id UUID PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    description VARCHAR(1000),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    owner_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_todo_tasks_owner FOREIGN KEY (owner_id) REFERENCES todo_users (id) ON DELETE CASCADE
);

CREATE INDEX idx_todo_tasks_owner ON todo_tasks (owner_id);
CREATE INDEX idx_todo_tasks_completed ON todo_tasks (completed);
