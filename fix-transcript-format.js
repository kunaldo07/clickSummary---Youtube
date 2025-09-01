// Fix transcript format issue
// The issue is transcript data is an array but code expects string

function convertTranscriptToString(transcript) {
    if (typeof transcript === 'string') {
        return transcript;
    }
    
    if (Array.isArray(transcript)) {
        // Convert array of segments to string
        return transcript.map(segment => {
            if (typeof segment === 'string') {
                return segment;
            } else if (segment && segment.text) {
                return segment.text;
            } else if (segment && typeof segment === 'object') {
                return Object.values(segment).join(' ');
            }
            return String(segment);
        }).join(' ');
    }
    
    // Fallback for other formats
    return String(transcript);
}

// Test this function
const testArray = [
    { text: 'Hello world', start: 0 },
    { text: 'This is a test', start: 10 },
    'Plain string segment'
];

console.log('Test conversion:', convertTranscriptToString(testArray));
// Should output: "Hello world This is a test Plain string segment"
