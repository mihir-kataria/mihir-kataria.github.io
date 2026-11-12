*Adapted from documentation I wrote for AIAG, an AI teaching assistant built at Arizona State University. Some details are simplified.*

# AIAG backend API: selected endpoints

This page documents three AIAG backend endpoints: asking a question, posting an unanswered question to the course discussion board, and creating a chat. It's for frontend developers who call the backend. The browser sends the user's session cookie with every request.

## Ask a question

`POST /api/similar_questions`

Checks that the question is about the course, retrieves the most similar passages from the course's knowledge base, and returns a generated answer with its sources.

**Request body (JSON)**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `question` | string | Yes | The student's question, in English or Chinese. |
| `history` | array | Yes | Earlier exchanges in this chat, oldest first, as objects with `Question` and `Answer` strings. Send `[]` for a new chat. |
| `language` | string | Yes | `en` for English or `zh` for Chinese. With `zh`, the question is translated into English for search and the sources into Chinese. |
| `class` | string | No | The course to search, when the user didn't open AIAG from a Canvas course. |
| `activeContainer` | string | Yes | Set to `asugpt`. |

**Example request**

```json
{ "question": "Can I use VS Code for the web services assignment?", "history": [], "language": "en", "class": "DEMO 101", "activeContainer": "asugpt" }
```

**Response (status `200`)**

| Field | Type | Description |
| --- | --- | --- |
| `gpt_result` | string | The answer text. |
| `engine_results` | array | The passages used as sources. Empty when the question is off topic. Absent when no passages matched. |
| `human_required` | boolean | `true` when no passages matched. The chat interface then offers to post the question to the discussion board. |
| `message` | string | The escalation prompt. Present only when `human_required` is `true`. |

**Example response**

```json
{
  "gpt_result": "Yes. Any editor works, as long as your services build and run in the required framework.",
  "engine_results": [
    { "message": "Is VS Code OK instead of Visual Studio?", "updated_at": "2024-02-03T18:22:10Z",
      "replies": [ { "message": "Yes, any editor is fine.", "updated_at": "2024-02-03T20:05:44Z", "replies": [] } ] }
  ],
  "human_required": false
}
```

An off-topic question returns an empty `engine_results` and a fixed refusal in `gpt_result`. If the OpenAI API fails after two retries, `gpt_result` is `OpenAI Unresponsive`.

**Errors**

| Status | Cause | Body |
| --- | --- | --- |
| `400` | `activeContainer` is missing or not a valid value | `{"error": "Invalid activeContainer"}` |
| `500` | A required field is missing | Error page |

## Post a question to the discussion board

`POST /api/create_discussion`

Creates a discussion topic from a question AIAG couldn't answer. The chat interface calls it after the student confirms they want to post.

**Request body (multipart form data)**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `question` | string | Yes | The discussion title, from the **Topic Title** field. |
| `body` | string | No | The discussion text. Defaults to empty. The chat interface fills it with the student's question. |
| `image` | file | No | An image to attach to the end of the post. |
| `course_id` | string | No | The course whose discussion board receives the post. |

**Example request fields:** `course_id` = `<COURSE_ID>`, `question` = `Deploying assignment 2 to the course server`, `body` = `My deployment fails after I upload the build. What should I check first?`

**Example response (status `201`)**

```json
{
  "message": "Discussion with image created successfully",
  "discussion_id": 9001,
  "title": "Deploying assignment 2 to the course server",
  "body": "My deployment fails after I upload the build. What should I check first?",
  "posted_at": "2025-03-18T21:04:55Z",
  "html_url": "<DISCUSSION_URL>"
}
```

The `message` text is the same whether or not an image is attached.

**Errors**

| Status | Cause | Body |
| --- | --- | --- |
| `400` | The discussion board rejected the post, for example because the title is missing | `{"error": "<reason>"}` |

## Create a chat

`POST /chats`

Creates an empty chat for the signed-in user. The chat interface calls it when the student selects **New Chat**, and on a first visit.

**Request body (JSON)**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `chatname` | string | Yes | The name shown in the sidebar. |

**Example:** the request `{ "chatname": "new chat" }` returns status `201` with `{ "message": "Chat added successfully", "chatID": 42 }`.

**Errors**

| Status | Cause | Body |
| --- | --- | --- |
| `401` | No user is signed in | `{"error": "User not authenticated"}` |
| `500` | `chatname` is missing | Error page |
