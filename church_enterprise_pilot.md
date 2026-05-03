# ⛪ Enterprise Pilot Chat (Church Edition)

## 🎯 Define the Pilot Scope (keep it tight)

Start with **3 core use cases only**:

### 1. Member Support Assistant

- Service times
- Location/directions
- Departments & contacts
- Event info

### 2. Admin Assistant (internal use)

- Draft announcements/emails
- Summarize sermons/notes
- Generate reports

### 3. Pastoral/HR Assistant

- Leave requests (staff)
- Basic counseling resources (non-sensitive)
- Policy lookup

> 👉 Don't try to cover everything. These 3 are enough for a pilot.

---

## 🏗️ System Architecture

You already have:

- n8n ✅
- Basic agent ✅
- Dashboard ✅

We'll extend it:

```
React Chat UI
      ↓
n8n Webhook (entry point)
      ↓
Intent Classifier (LLM)
      ↓
 ┌───────────────┬───────────────┐
 │               │               │
RAG         Tool Use        General Chat
 │               │               │
Docs DB     Email Tool      LLM Response
 │               │               │
      ↓
Response + Logging → Dashboard
```

---

## 🧠 Step 1: Knowledge Base

Replace Wikipedia with **Church Knowledge**.

### Documents to upload

- Church vision/mission
- Service schedule
- Departments (ushers, media, choir, etc.)
- Event calendar
- Sermon summaries
- Policies (workers, finance, etc.)

### Hybrid Retrieval

Use:

- **Dense** → embeddings (meaning)
- **Sparse** → keyword (e.g., "Sunday service time")

Tools:

- **Simple**: FAISS + BM25
- **Better**: Weaviate / Qdrant

---

## 🔄 Step 2: n8n Workflow (core flow)

### 1. Webhook Node (Chat Input)

Receives:

```json
{
  "userId": "123",
  "message": "What time is Sunday service?"
}
```

### 2. Intent Classifier (LLM Node)

Classify into:

- `info_request`
- `action_request`
- `general_chat`

### 3A. Info Request → RAG Flow

- Query vector DB
- Retrieve top docs
- Send to LLM

**Output:**
> "Sunday service starts at 8:00 AM and 10:30 AM…"

### 3B. Action Request → Tool Flow

**Example:**
> "Send announcement to workers"

Flow:
1. Generate draft
2. Send back for approval
3. If approved → Send_Mail tool

### 3C. General Chat

Direct LLM response (with church tone).

---

## ✉️ Step 3: Email Tool (upgrade it)

Flow MUST be:

1. Draft: *"Here's the email. Approve?"*
2. User confirms: *"Yes"*
3. Then send

> 👉 This prevents mistakes — critical in church comms.

---

## 🔐 Step 4: Roles & Access

### Admin
- Send emails
- View analytics

### Staff/Workers
- Use assistant
- Request actions

### Members
- Only ask questions

> 👉 Enforce this in n8n using `userId` and role mapping (simple JSON or DB).

---

## 📊 Step 5: Monitoring Dashboard

### Metrics

- Requests per day
- Most asked questions
- Failed responses
- Email sends

### Logs Table

| Field | Description |
|-------|-------------|
| user | Who asked |
| query | What they asked |
| response | What was returned |
| status | Success / failure |

### Alerts

- High error rate
- Failed email sends

---

## 🚨 Step 6: Guardrails

Your assistant should **NOT**:

- Give spiritual counseling beyond safe scope
- Share private member info
- Send messages without approval

Add rules like:
> "If sensitive topic → recommend human pastor"

---

## 👍 Step 7: Feedback System

After each response:

- 👍 Helpful
- 👎 Not helpful

Store it → improve system later.

---

## 🎤 Church Tone (custom personality)

Define system prompt:

> "You are a respectful, warm, and faith-aligned assistant for a church. You communicate clearly, encourage participation, and maintain a welcoming tone."

---

## 🚀 Step 8: Deployment Plan (Pilot)

| Week | Tasks |
|------|-------|
| Week 1 | Build RAG (church docs), basic chat working |
| Week 2 | Add email tool (with approval), connect dashboard |
| Week 3 | Test with media team and admin staff |
| Week 4 | Roll out to small group (pilot users) |

---

## 📈 Success Metrics

Track:

- % correct answers
- Time saved (admin tasks)
- Engagement (daily users)
- Errors

---

## ⚠️ Final Reality Check

If you skip:

- RAG (docs)
- Approval flow
- Monitoring

> 👉 Your system will break trust quickly.

---

## Next Steps

Choose your starting point:

- **n8n workflow blueprint** — node-by-node export style
- **RAG setup** — structuring church documents for retrieval
- **Dashboard upgrade** — logs + analytics panels
