# Document Query Agent - User Guide

## 🎯 Overview

The Document Query Agent is an AI-powered system that automatically searches your documentation to find relevant solutions for support tickets. It uses advanced vector embeddings and language models to understand ticket context and match it with your knowledge base.

## ✨ Features

- **Automatic Document Indexing**: Indexes PDF, Markdown, and text files
- **Semantic Search**: Finds relevant documentation based on meaning, not just keywords
- **AI-Powered Solutions**: Generates step-by-step solutions using LLM
- **Confidence Scoring**: Shows how confident the system is in its suggestions
- **Document References**: Links solutions back to source documentation
- **Multi-Format Support**: Works with `.pdf`, `.md`, and `.txt` files

## 📁 Folder Structure

```
docs/
├── guides/          # Technical guides and how-tos
├── manuals/         # Product manuals and documentation
└── uploads/         # User-uploaded documents
```

## 🚀 Getting Started

### 1. Add Documentation

Place your documentation files in the `docs/` folder:

```bash
# Create documentation
/docs/guides/network-troubleshooting.md
/docs/guides/software-installation.md
/docs/guides/hardware-diagnostics.txt
/docs/manuals/product-manual.pdf
```

### 2. Index Documents

**Via API** (Recommended for initial setup):

```bash
curl -X POST http://localhost:8080/api/docs/index \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"path": "./docs"}'
```

**Via Admin Panel**:
- Navigate to Admin Dashboard
- Go to Document Management
- Click "Index Documents"
- Select folder to index

### 3. Use in Tickets

When viewing a ticket:
1. Click on the ticket to open details
2. Scroll to "AI-Powered Solutions" section
3. Click "Find Solutions" button
4. Review AI-generated solutions and relevant documents

## 🔧 API Endpoints

### Index Documents
```http
POST /api/docs/index
Authorization: Bearer <token>
Content-Type: application/json

{
  "path": "./docs"
}
```

**Response**:
```json
{
  "message": "Successfully indexed 15 documents",
  "count": 15,
  "documents": [...]
}
```

### Search Documents
```http
POST /api/docs/search
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "network connectivity issues",
  "topK": 5,
  "minScore": 0.7
}
```

**Response**:
```json
{
  "query": "network connectivity issues",
  "results": [
    {
      "document": {
        "title": "network-troubleshooting.md",
        "summary": "Guide for network issues..."
      },
      "score": 0.92,
      "relevance": "High"
    }
  ],
  "count": 5
}
```

### Get Ticket Solutions
```http
GET /api/tickets/:id/solutions
Authorization: Bearer <token>
```

**Response**:
```json
{
  "ticketId": "123",
  "solutions": [
    {
      "title": "Check Network Configuration",
      "description": "Verify network settings...",
      "steps": [
        "Open Network Settings",
        "Check IP configuration"
      ],
      "references": ["network-troubleshooting.md"],
      "confidence": 0.85
    }
  ],
  "documentSources": [...],
  "confidence": 0.82,
  "generatedAt": "2024-01-15T10:30:00Z"
}
```

### Upload Document
```http
POST /api/docs/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

document: [file]
```

### Get Index Stats
```http
GET /api/docs/stats
Authorization: Bearer <token>
```

**Response**:
```json
{
  "indexedDocuments": 25,
  "status": "active"
}
```

## 🧠 How It Works

### 1. Document Processing

```
Document File → Extract Text → Chunk Content → Generate Embeddings
```

- **Text Extraction**: Reads content from PDF, MD, TXT files
- **Chunking**: Splits into 500-word semantic chunks for better search
- **Embedding**: Converts text to vector representations (384 dimensions)

### 2. Search Process

```
Ticket Query → Generate Embedding → Vector Similarity Search → Rank Results
```

- Converts ticket into search query
- Finds similar document chunks using cosine similarity
- Ranks by relevance score
- Filters by minimum threshold (default: 0.3)

### 3. Solution Generation

```
Relevant Docs → LLM Prompt → Generate Solutions → Format Response
```

- Combines ticket context with relevant documentation
- Uses LLM (OpenAI/Local) to generate structured solutions
- Provides step-by-step instructions
- Includes document references and confidence scores

## ⚙️ Configuration

### Environment Variables

```bash
# AI Provider (openai, local, or mock)
AI_PROVIDER=openai

# OpenAI Configuration
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4

# Local LLM Configuration
LOCAL_LLM_URL=http://localhost:8000

# Vector Embedding
# Uses same AI_PROVIDER setting
```

### Provider Options

**OpenAI (Recommended)**:
- Best quality solutions
- Requires API key
- Embeddings: `text-embedding-3-small`
- LLM: `gpt-3.5-turbo` or `gpt-4`

**Local LLM**:
- Free and private
- Requires local LLM server
- Compatible with OpenAI API format
- Examples: Ollama, LM Studio, LocalAI

**Mock Mode** (Default):
- No API key required
- Rule-based solutions
- Good for testing
- Limited accuracy

## 📊 Solution Confidence Levels

- **High (80-100%)**: Multiple relevant documents found, clear solution path
- **Medium (60-79%)**: Some relevant information found, reasonable solution
- **Low (<60%)**: Limited documentation available, generic suggestions

## 🎨 Frontend Integration

### TicketSolutionPanel Component

```typescript
import TicketSolutionPanel from './components/TicketSolutionPanel';

// In ticket details
<TicketSolutionPanel ticketId={ticket.id} />
```

**Features**:
- One-click solution finding
- Expandable solution details
- Step-by-step instructions
- Document source references
- Confidence indicators

## 📝 Best Practices

### Document Organization

1. **Use Clear Filenames**:
   ```
   ✅ network-troubleshooting-guide.md
   ✅ windows-10-installation-steps.md
   ❌ doc1.txt
   ❌ untitled.md
   ```

2. **Structure Documents Well**:
   - Use headings and sections
   - Include clear instructions
   - Add examples and commands
   - Keep related info together

3. **Update Regularly**:
   - Re-index after adding new docs
   - Remove outdated information
   - Version important procedures
   - Date-stamp documents

### Writing Good Documentation

**For Better AI Understanding**:

✅ **Good**:
```markdown
## Network Connectivity Issues

### Symptoms
- Cannot connect to internet
- WiFi shows "No internet access"

### Solution Steps
1. Check physical cable connections
2. Restart router (wait 30 seconds)
3. Update network drivers
4. Test with `ping 8.8.8.8`
```

❌ **Less Effective**:
```markdown
Network broke. Try stuff until it works.
```

### Indexing Tips

1. **Initial Index**: Index all documents when setting up
2. **Incremental Updates**: Re-index after adding new documents
3. **Batch Processing**: Index multiple files at once for efficiency
4. **Schedule Regular Re-indexing**: Weekly or monthly depending on update frequency

## 🐛 Troubleshooting

### No Solutions Found

**Causes**:
- No documents indexed
- Query too specific
- Minimum score threshold too high
- Documents don't match ticket category

**Solutions**:
- Verify documents are indexed: `GET /api/docs/stats`
- Add more relevant documentation
- Lower `minScore` threshold
- Broaden search terms

### Low Confidence Scores

**Causes**:
- Insufficient documentation coverage
- Ticket description too vague
- Terminology mismatch

**Solutions**:
- Add more detailed documentation
- Use consistent terminology
- Include common variations and synonyms
- Provide more context in tickets

### Slow Performance

**Causes**:
- Large number of documents
- Complex embeddings
- API rate limits

**Solutions**:
- Use local LLM for faster responses
- Implement caching
- Reduce chunk size
- Use vector database (Qdrant, Weaviate)

### Incorrect Solutions

**Causes**:
- Outdated documentation
- Ambiguous ticket descriptions
- Limited context

**Solutions**:
- Update documentation regularly
- Provide more ticket details
- Review and refine prompts
- Use higher quality LLM

## 🔐 Security Considerations

1. **Document Access**:
   - Requires authentication
   - Admin-only indexing
   - All users can search

2. **Sensitive Information**:
   - Don't include passwords in docs
   - Redact sensitive data
   - Use generic examples

3. **API Keys**:
   - Store in environment variables
   - Never commit to version control
   - Rotate regularly

## 🚀 Advanced Features

### Custom Vector Database

Replace in-memory storage with:
- **Qdrant**: Fast vector similarity search
- **Weaviate**: Semantic search platform
- **pgvector**: PostgreSQL extension
- **Pinecone**: Managed vector database

### Enhanced PDF Support

Install PDF parsing library:
```go
go get github.com/ledongthuc/pdf
// or
go get github.com/unidoc/unipdf/v3
```

### Multilingual Support

Add language detection and translation for multi-language documentation.

### Document Versioning

Track document changes and prefer newer versions in search results.

## 📈 Monitoring

### Key Metrics

- Documents indexed
- Average search time
- Solution confidence scores
- User feedback on solutions
- API response times

### Logging

Check logs for:
- Indexing errors
- Search performance
- LLM generation failures
- API errors

## 🤝 Contributing

### Adding New Features

1. Implement in backend services
2. Add API endpoints
3. Update frontend components
4. Add tests
5. Update documentation

### Improving Solutions

1. Review generated solutions
2. Identify patterns in failures
3. Update prompts
4. Add more documentation
5. Refine search algorithms

## 📚 Resources

- **OpenAI API**: https://platform.openai.com/docs
- **Vector Embeddings**: Understanding semantic search
- **LLM Prompting**: Best practices for AI instructions
- **Document Processing**: Text extraction techniques

## 🆘 Support

If you encounter issues:
1. Check logs for errors
2. Verify API keys and configuration
3. Test with mock mode
4. Review documentation format
5. Contact system administrator

---

**Version**: 1.0.0
**Last Updated**: January 2024
**Maintained By**: IntelliOps AI Team

