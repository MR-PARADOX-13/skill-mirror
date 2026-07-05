export interface Question {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const pythonQuestions: Question[] = [
  {
    id: 1,
    text: "Which of the following is an immutable data type in Python?",
    options: ["List", "Dictionary", "Set", "Tuple"],
    correctIndex: 3,
    explanation: "Tuples in Python are immutable, meaning their elements cannot be changed after creation, unlike list, dict, and set."
  },
  {
    id: 2,
    text: "What is the output of `print(type(1 / 2))` in Python 3?",
    options: ["<class 'int'>", "<class 'float'>", "<class 'double'>", "SyntaxError"],
    correctIndex: 1,
    explanation: "In Python 3, single slash division `/` always returns a float representation, so `1 / 2` is `0.5`, which is a float."
  },
  {
    id: 3,
    text: "How do you add an element to the end of a list in Python?",
    options: ["list.add(item)", "list.push(item)", "list.append(item)", "list.insert(item)"],
    correctIndex: 2,
    explanation: "`append()` is the standard built-in method to append elements to the end of a list in Python."
  },
  {
    id: 4,
    text: "Which keyword is used to define a generator function in Python?",
    options: ["return", "yield", "gen", "produce"],
    correctIndex: 1,
    explanation: "The `yield` keyword is used in a function to return values lazily, turning it into a generator."
  },
  {
    id: 5,
    text: "What is the purpose of the `__init__` method in Python classes?",
    options: ["To delete objects", "To represent objects as strings", "To initialize class instances on creation", "To define class constants"],
    correctIndex: 2,
    explanation: "`__init__` acts as a constructor in Python, executing code when a class instance is initialized."
  },
  {
    id: 6,
    text: "What is the output of `bool('False')` in Python?",
    options: ["True", "False", "ValueError", "None"],
    correctIndex: 0,
    explanation: "In Python, any non-empty string is considered truthy, so `bool('False')` returns `True`."
  },
  {
    id: 7,
    text: "What does the `pass` statement do in Python?",
    options: ["It terminates the current loop.", "It acts as a placeholder and does nothing.", "It returns None from a function.", "It skips the rest of the loop block."],
    correctIndex: 1,
    explanation: "`pass` is a null statement. It is used as a placeholder when a statement is syntactically required but no code needs to be executed."
  },
  {
    id: 8,
    text: "Which of the following is used to handle exceptions in Python?",
    options: ["try/except", "try/catch", "throw/catch", "try/handle"],
    correctIndex: 0,
    explanation: "Python uses `try` and `except` blocks to handle exceptions gracefully."
  },
  {
    id: 9,
    text: "Which statement is correct regarding local and global variables in Python?",
    options: [
      "Global variables can be modified inside functions without global keyword",
      "Local variables have higher precedence over global variables with the same name inside their local scope",
      "Global variables cannot be accessed inside local scopes",
      "Local variables can be accessed anywhere"
    ],
    correctIndex: 1,
    explanation: "If a local variable has the same name as a global variable, it shadows/takes precedence over the global variable within that local scope."
  }
];

export const javaQuestions: Question[] = [
  {
    id: 101,
    text: "Which of these is not a primitive data type in Java?",
    options: ["byte", "int", "String", "boolean"],
    correctIndex: 2,
    explanation: "String is a class/reference type in Java, whereas byte, int, and boolean are built-in primitives."
  },
  {
    id: 102,
    text: "Which access modifier makes a member visible only within its own class?",
    options: ["private", "public", "protected", "package-private (default)"],
    correctIndex: 0,
    explanation: "Members declared as `private` can only be accessed within the class in which they are defined."
  },
  {
    id: 103,
    text: "What is the output of `5 + 2 + \"7\"` in Java?",
    options: ["\"527\"", "\"77\"", "\"14\"", "CompileError"],
    correctIndex: 1,
    explanation: "Java evaluates left-to-right. `5 + 2` is evaluated first to `7`. Then, adding String `\"7\"` does string concatenation resulting in `\"77\"`."
  },
  {
    id: 104,
    text: "Which of the following classes is thread-safe in Java?",
    options: ["ArrayList", "HashMap", "StringBuilder", "Vector"],
    correctIndex: 3,
    explanation: "`Vector` methods are synchronized, making it thread-safe, unlike ArrayList, HashMap, or StringBuilder."
  },
  {
    id: 105,
    text: "What does the `final` keyword signify when applied to a class?",
    options: ["The class cannot be instantiated", "The class is deprecated", "The class cannot be subclassed/inherited", "The class has no methods"],
    correctIndex: 2,
    explanation: "A class marked as `final` cannot be extended by other classes."
  },
  {
    id: 106,
    text: "Which of the following is used to handle exceptions in Java?",
    options: ["try/except", "try/catch", "error/catch", "throw/catch"],
    correctIndex: 1,
    explanation: "Java uses `try` and `catch` blocks for structural exception handling."
  },
  {
    id: 107,
    text: "What is the default value of a boolean variable declared as an instance field in Java?",
    options: ["true", "false", "0", "null"],
    correctIndex: 1,
    explanation: "In Java, instance boolean fields default to `false` when initialized."
  },
  {
    id: 108,
    text: "Which class is the ultimate superclass of all classes in Java?",
    options: ["String", "Class", "Object", "System"],
    correctIndex: 2,
    explanation: "Every class in Java directly or indirectly inherits from the `java.lang.Object` class."
  },
  {
    id: 109,
    text: "What does the `static` keyword mean when applied to a class member?",
    options: [
      "The member belongs to the class itself rather than instances",
      "The member value cannot be changed after creation",
      "The member is visible everywhere in the project",
      "The member runs asynchronously on another thread"
    ],
    correctIndex: 0,
    explanation: "`static` members are associated with the class itself rather than individual class objects."
  }
];

export const dsaQuestions: Question[] = [
  {
    id: 201,
    text: "What is the average time complexity of searching in a Hash Table?",
    options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
    correctIndex: 0,
    explanation: "On average, hash table lookups take constant time O(1) assuming a uniform hashing function with minimal collisions."
  },
  {
    id: 202,
    text: "Which data structure operates on a Last In First Out (LIFO) basis?",
    options: ["Queue", "Stack", "Linked List", "Binary Search Tree"],
    correctIndex: 1,
    explanation: "A Stack operates on a LIFO (Last In First Out) basis, whereas a Queue operates on FIFO (First In First Out)."
  },
  {
    id: 203,
    text: "Which algorithms are typically used to find the shortest path in a weighted graph?",
    options: ["Kruskal's Algorithm", "Dijkstra's Algorithm", "Depth First Search (DFS)", "Inorder Traversal"],
    correctIndex: 1,
    explanation: "Dijkstra's Algorithm finds the shortest paths in weighted graphs with non-negative edge weights."
  },
  {
    id: 204,
    text: "What is the worst-case time complexity of Quick Sort?",
    options: ["O(N)", "O(N log N)", "O(N^2)", "O(2^N)"],
    correctIndex: 2,
    explanation: "Quick Sort defaults to O(N^2) in the worst-case when the partition selection is highly unbalanced."
  },
  {
    id: 205,
    text: "Which traversal of a Binary Search Tree produces values in sorted, ascending order?",
    options: ["Pre-order", "In-order", "Post-order", "Level-order (BFS)"],
    correctIndex: 1,
    explanation: "An In-order traversal visits left, root, and then right, which outputs binary search tree elements in sorted ascending order."
  },
  {
    id: 206,
    text: "What is the time complexity of binary search on a sorted array of size N?",
    options: ["O(N)", "O(N log N)", "O(log N)", "O(1)"],
    correctIndex: 2,
    explanation: "Binary search repeatedly divides the search interval in half, leading to logarithmic O(log N) operations."
  },
  {
    id: 207,
    text: "Which data structure operates on a First In First Out (FIFO) basis?",
    options: ["Stack", "Queue", "Binary Tree", "Max Heap"],
    correctIndex: 1,
    explanation: "A Queue operates on a FIFO basis, where elements are inserted at the back and removed from the front."
  },
  {
    id: 208,
    text: "What is the time complexity to insert a new node at the beginning of a singly linked list?",
    options: ["O(1)", "O(N)", "O(log N)", "O(N log N)"],
    correctIndex: 0,
    explanation: "Inserting at the beginning only requires updating the new node's next pointer and head reference, which is O(1) constant time."
  },
  {
    id: 209,
    text: "Which of the following sorting algorithms is stable by default?",
    options: ["Quick Sort", "Merge Sort", "Heap Sort", "Selection Sort"],
    correctIndex: 1,
    explanation: "Merge Sort is a stable sorting algorithm because it preserves the relative order of equal elements during its merge phase."
  }
];

export const aptitudeQuestions: Question[] = [
  {
    id: 301,
    text: "A train running at speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?",
    options: ["120 meters", "150 meters", "180 meters", "324 meters"],
    correctIndex: 1,
    explanation: "Speed in m/s = 60 * (5/18) = 50/3 m/s. Length of train = Speed * Time = (50/3) * 9 = 150 meters."
  },
  {
    id: 302,
    text: "If 10 men can build a wall in 8 days, how many men are needed to build the same wall in 4 days?",
    options: ["5 men", "15 men", "20 men", "40 men"],
    correctIndex: 2,
    explanation: "Work = Men * Days = 10 * 8 = 80 man-days. To complete in 4 days: 80 / 4 = 20 men are required."
  },
  {
    id: 303,
    text: "What is the next number in the series: 2, 6, 12, 20, 30, ___?",
    options: ["40", "42", "44", "46"],
    correctIndex: 1,
    explanation: "The differences are consecutive even numbers: +4, +6, +8, +10. Next difference is +12, so 30 + 12 = 42."
  },
  {
    id: 304,
    text: "The average of 5 consecutive numbers is 20. What is the largest of these numbers?",
    options: ["20", "22", "24", "25"],
    correctIndex: 1,
    explanation: "Let numbers be x-2, x-1, x, x+1, x+2. Their sum is 5x, so 5x/5 = x = 20. The largest number is x+2 = 22."
  },
  {
    id: 305,
    text: "A shopkeeper sells a book for $240, making a profit of 20%. What was the cost price of the book?",
    options: ["$180", "$200", "$210", "$220"],
    correctIndex: 1,
    explanation: "Selling Price = Cost Price * 1.2. Hence Cost Price = 240 / 1.2 = $200."
  },
  {
    id: 306,
    text: "A person crosses a 600-meter long street in 5 minutes. What is his speed in km/hr?",
    options: ["3.6 km/hr", "7.2 km/hr", "8.4 km/hr", "10 km/hr"],
    correctIndex: 1,
    explanation: "Speed in m/s = 600m / 300s = 2 m/s. Speed in km/hr = 2 * 18/5 = 7.2 km/hr."
  },
  {
    id: 307,
    text: "In a class, there are 15 boys and 10 girls. Three students are selected at random. What is the probability that exactly 1 girl and 2 boys are selected?",
    options: ["21/46", "21/23", "15/46", "3/23"],
    correctIndex: 0,
    explanation: "Probability = (10C1 * 15C2) / 25C3 = (10 * 105) / 2300 = 1050/2300 = 21/46."
  },
  {
    id: 308,
    text: "If A and B can do a piece of work in 8 days and A alone can do it in 12 days, in how many days can B alone complete it?",
    options: ["16 days", "20 days", "24 days", "30 days"],
    correctIndex: 2,
    explanation: "B's 1-day work = 1/8 - 1/12 = 3/24 - 2/24 = 1/24. Thus, B can do the work alone in 24 days."
  },
  {
    id: 309,
    text: "Find the odd one out of the series: 3, 5, 7, 12, 17, 19.",
    options: ["5", "12", "17", "19"],
    correctIndex: 1,
    explanation: "All numbers in the series are prime numbers except for 12, which is an even composite number."
  }
];

// Returns exactly 5 randomized questions with randomized options and updated correct indices
export function getRandomizedQuestions(subject: "python" | "java" | "dsa" | "aptitude"): Question[] {
  let pool: Question[] = [];
  switch (subject) {
    case "python":
      pool = [...pythonQuestions];
      break;
    case "java":
      pool = [...javaQuestions];
      break;
    case "dsa":
      pool = [...dsaQuestions];
      break;
    case "aptitude":
      pool = [...aptitudeQuestions];
      break;
    default:
      return [];
  }

  // Shuffle the pool of questions
  const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
  // Take first 5 questions
  const selected = shuffledPool.slice(0, 5);

  // Shuffle the options of each selected question and update correctIndex
  return selected.map((q, idx) => {
    const originalCorrectOption = q.options[q.correctIndex];
    // Shuffle options
    const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
    const newCorrectIndex = shuffledOptions.indexOf(originalCorrectOption);
    return {
      ...q,
      id: q.id + (idx + 1) * 1000 + Math.floor(Math.random() * 500), // Ensure stable, highly unique IDs
      options: shuffledOptions,
      correctIndex: newCorrectIndex
    };
  });
}
