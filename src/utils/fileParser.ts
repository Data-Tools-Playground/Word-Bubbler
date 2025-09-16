export interface ParsedData {
  responses: string[];
  metadata?: {
    fileName: string;
    fileSize: number;
    rowCount: number;
  };
}

export async function parseFile(file: File): Promise<ParsedData> {
  const text = await file.text();
  const fileName = file.name;
  const fileSize = file.size;

  let responses: string[] = [];

  try {
    if (fileName.toLowerCase().endsWith('.csv')) {
      responses = parseCSV(text);
    } else if (fileName.toLowerCase().endsWith('.json')) {
      responses = parseJSON(text);
    } else if (fileName.toLowerCase().endsWith('.txt')) {
      responses = parseTextFile(text);
    } else {
      // Default to treating as plain text
      responses = parseTextFile(text);
    }

    return {
      responses: responses.filter(response => response.trim().length > 0),
      metadata: {
        fileName,
        fileSize,
        rowCount: responses.length
      }
    };
  } catch (error) {
    throw new Error(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function parseCSV(text: string): string[] {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);

  if (lines.length === 0) return [];

  // Check if first line looks like headers
  const firstLine = lines[0];
  const hasHeaders = firstLine.toLowerCase().includes('response') ||
                    firstLine.toLowerCase().includes('text') ||
                    firstLine.toLowerCase().includes('answer') ||
                    firstLine.toLowerCase().includes('comment');

  const dataLines = hasHeaders ? lines.slice(1) : lines;
  const responses: string[] = [];

  for (const line of dataLines) {
    // Simple CSV parsing - handle quoted fields
    const fields = parseCSVLine(line);

    // Try to find the text column - usually the longest field or contains text
    let textField = '';

    if (fields.length === 1) {
      // Single column, use as is
      textField = fields[0];
    } else {
      // Multiple columns, find the one with the most text content
      textField = fields.reduce((longest, current) =>
        current.length > longest.length ? current : longest, '');
    }

    if (textField && textField.trim()) {
      responses.push(textField.trim());
    }
  }

  return responses;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields.map(field => field.replace(/^"|"$/g, '')); // Remove surrounding quotes
}

function parseJSON(text: string): string[] {
  const data = JSON.parse(text);
  const responses: string[] = [];

  if (Array.isArray(data)) {
    for (const item of data) {
      if (typeof item === 'string') {
        responses.push(item);
      } else if (typeof item === 'object' && item !== null) {
        // Look for common text field names
        const textFields = ['response', 'text', 'answer', 'comment', 'feedback', 'content'];
        let found = false;

        for (const field of textFields) {
          if (item[field] && typeof item[field] === 'string') {
            responses.push(item[field]);
            found = true;
            break;
          }
        }

        // If no standard field found, use the first string value
        if (!found) {
          for (const value of Object.values(item)) {
            if (typeof value === 'string' && value.trim()) {
              responses.push(value);
              break;
            }
          }
        }
      }
    }
  } else if (typeof data === 'object' && data !== null) {
    // Single object, extract string values
    for (const value of Object.values(data)) {
      if (typeof value === 'string' && value.trim()) {
        responses.push(value);
      }
    }
  }

  return responses;
}

function parseTextFile(text: string): string[] {
  // Split by common delimiters and clean up
  const lines = text
    .split(/[\n\r]+/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  return lines;
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'text/csv',
    'application/json',
    'text/plain',
    'text/tab-separated-values',
    '.csv',
    '.json',
    '.txt',
    '.tsv'
  ];

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  const isAllowedType = allowedTypes.some(type =>
    file.type === type || fileExtension === type
  );

  if (!isAllowedType) {
    return {
      valid: false,
      error: 'File must be CSV, JSON, or TXT format'
    };
  }

  return { valid: true };
}