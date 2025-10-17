# Documentation Repository

This folder contains all documentation that will be indexed by the Document Query Agent.

## Folder Structure

- **`guides/`**: Technical guides, troubleshooting procedures, and how-to documentation
- **`manuals/`**: Product manuals, user guides, and detailed specifications  
- **`uploads/`**: User-uploaded documents via the application

## Supported File Formats

- **PDF** (`.pdf`) - Portable Document Format files
- **Markdown** (`.md`) - Markdown formatted documentation
- **Text** (`.txt`) - Plain text files

## Adding New Documentation

### Method 1: File System
1. Place your files in the appropriate folder (`guides/`, `manuals/`, or `uploads/`)
2. Run the indexing process:
   ```bash
   curl -X POST http://localhost:8080/api/docs/index \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"path": "./docs"}'
   ```

### Method 2: Upload API
```bash
curl -X POST http://localhost:8080/api/docs/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "document=@your-file.pdf"
```

## Current Documentation

### Guides
- `network-troubleshooting.md` - Comprehensive network issue diagnostics
- `software-installation.md` - Software installation procedures for all platforms
- `hardware-diagnostics.txt` - Hardware troubleshooting and maintenance

## Writing Effective Documentation

For best AI understanding and search results:

### ✅ Good Practices
- Use clear headings and sections
- Include step-by-step instructions
- Add symptoms and solutions
- Use consistent terminology
- Include command examples
- Add common error messages

### ❌ Avoid
- Vague descriptions
- Inconsistent formatting
- Missing context
- Outdated information
- Personal notes without structure

## Example Structure

```markdown
# Topic Name

## Problem Description
Clear description of the issue

## Symptoms
- Symptom 1
- Symptom 2

## Solution Steps
1. First step
2. Second step
3. Third step

## Verification
How to verify the fix worked

## Related Issues
Links to related documentation
```

## Maintenance

- **Frequency**: Re-index after adding/updating documents
- **Cleanup**: Remove outdated documentation regularly
- **Versioning**: Keep track of document versions
- **Backup**: Maintain backups of all documentation

## Tips for Better Search Results

1. **Use Standard Terminology**: Stick to common IT terms
2. **Include Variations**: Add synonyms and alternative terms
3. **Be Specific**: Detailed descriptions help matching
4. **Structure Well**: Use headings for better chunking
5. **Update Regularly**: Keep information current

## Statistics

Check indexing statistics:
```bash
curl http://localhost:8080/api/docs/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Need Help?

Refer to `DOCUMENT_AGENT_GUIDE.md` in the project root for complete documentation on:
- API usage
- Configuration
- Troubleshooting
- Best practices
- Advanced features

