// Mapping of characters to their likely substitutions.
const _mappings = {
    '0': ['0', 'o', 'O'],
    '1': ['1', 'i', 'I', '!'],
    '2': ['2', 'z', 'Z'],
    '3': ['3', 'e', 'E'],
    '4': ['4', 'h', 'H'],
    '5': ['5', 's', 'S', '$'],
    '6': ['6', 'b', 'B'],
    '7': ['7', 't', 'T'],
    '8': ['8', 'g', 'G', '&'],
    '9': ['9', 'p', 'P'],
    'a': ['a', 'A', '@'],
    'b': ['b', 'B', '6', '*'],
    'c': ['c', 'C', '('],
    'd': ['d', 'D', ')'],
    'e': ['e', 'E', '3'],
    'f': ['f', 'F'],
    'g': ['g', 'G', '8', '&'],
    'h': ['h', 'H', '#', '-'],
    'i': ['i', 'I', '1', '!'],
    'j': ['j', 'J'],
    'k': ['k', 'K', '<'],
    'l': ['l', 'L', '|'],
    'm': ['m', 'M'],
    'n': ['n', 'N', '\\'],
    'o': ['o', 'O', '0'],
    'p': ['p', 'P', '9'],
    'q': ['q', 'Q'],
    'r': ['r', 'R'],
    's': ['s', 'S', '5', '$'],
    't': ['t', 'T', '7'],
    'u': ['u', 'U'],
    'v': ['v', 'V', '^'],
    'w': ['w', 'W'],
    'x': ['x', 'X', '%'],
    'y': ['y', 'Y'],
    'z': ['z', 'Z', '2', '/'],
    '!': ['1', 'i', 'I', '!'],
    '$': ['5', 's', 'S', '$'],
    '&': ['8', 'g', 'G', '&'],
    '@': ['a', 'A', '@'],
    '*': ['b', 'B', '*'],
    '(': ['c', 'C', '('],
    ')': ['d', 'D', ')'],
    '#': ['h', 'H', '#', '-'],
    '-': ['h', 'H', '#', '-'],
    '<': ['k', 'K', '<'],
    '|': ['l', 'L', '|'],
    '\\': ['n', 'N', '\\'],
    '^': ['v', 'V', '^'],
    '%': ['x', 'X', '%'],
    '/': ['z', 'Z', '2', '/']
};

// Create a function that takes a string and returns a scrambled version of the string. The function will change the characters to a random character from the _mappings object.
function scrambleString() {
    // Get the input text
    var input = document.getElementById("inputText").value;

    // Check if the input is empty
    if (!input) {
        return;
    }

    // Remove leading and trailing whitespace
    input = input.trim();

    // Limit the input to 22 characters
    if (input.length > 22) {
        input = input.substring(0, 22);
    }

    // Convert the input to lowercase
    input = input.toLowerCase();

    // Scramble the input string
    let builder = [];
    for (const c of input) {
        if (_mappings.hasOwnProperty(c)) {
            const chars = _mappings[c];
            builder.push(chars[Math.floor(Math.random() * chars.length)]);
        } else {
            builder.push(c);
        }
    }

    // Add the last two digits of the current year to the end of the scrambled string
    document.getElementById("outputText").value = builder.join('') + new Date().getFullYear().toString().slice(-2);
}