import { RoadmapTopic } from "./types";

export const roadmapTemplates: Record<string, Omit<RoadmapTopic, "completed">[]> = {
  "AI Engineer": [
    {
      id: "ai-1",
      name: "Python Core & Object-Oriented Programming (OOP)",
      category: "Python",
      difficulty: "Beginner",
      duration: "2 weeks",
      description: "Master variables, foundational structure collections (lists, tuples, dicts), conditional flows, functional programming, classes, inheritance, encapsulation, and error handling. This establishes standard development practices.",
      youtubeUrl: "https://www.youtube.com/watch?v=8DvywoWv6fI",
      youtubeTitle: "Python Tutorial for Beginners (Programming with Mosh)"
    },
    {
      id: "ai-2",
      name: "Data Analytics (Pandas, NumPy, Matplotlib)",
      category: "Python",
      difficulty: "Beginner",
      duration: "2 weeks",
      description: "Learn high-performance multi-dimensional array operations with NumPy, structural analysis, data cleaning, filtering, and aggregations with Pandas, and data visualization/plotting with Matplotlib and Seaborn.",
      youtubeUrl: "https://www.youtube.com/watch?v=vmEHCJofHSg",
      youtubeTitle: "Pandas Full Tutorial for Data Analysis (Keith Galli)"
    },
    {
      id: "ai-3",
      name: "Machine learning",
      category: "Math",
      difficulty: "Intermediate",
      duration: "3 weeks",
      description: "Gain a solid grasp of linear transformations, vector spaces, matrix factorization, calculus gradient logic, hypothesis tests, distribution profiles, and probability models essential for training predictors.",
      youtubeUrl: "https://youtu.be/i_LwzRVP7bg?si=EtGwDMVMt0ypKhLF",
      youtubeTitle: "Essence of Linear Algebra Course (3Blue1Brown)"
    },
    {
      id: "ai-4",
      name: "Supervised & Unsupervised Machine Learning (Scikit-Learn)",
      category: "ML Core",
      difficulty: "Intermediate",
      duration: "4 weeks",
      description: "Build robust classification, regression, clustering models, and support vector machines. Learn hyperparameter matching, ensemble methods, cross-validation scoring, and model deployment blueprints.",
      youtubeUrl: "https://www.youtube.com/watch?v=GwIo3gToVi0",
      youtubeTitle: "Machine Learning Course for Beginners (freeCodeCamp)"
    },
    {
      id: "ai-5",
      name: "Deep Learning & Neural Networks (TensorFlow/PyTorch)",
      category: "Deep Learning",
      difficulty: "Advanced",
      duration: "4 weeks",
      description: "Differentiate forward and backward propagation algorithms. Design neural networks, configure layer nodes, leverage artificial neurons, tune loss functions, and optimize performance.",
      youtubeUrl: "https://www.youtube.com/watch?v=aircAruvnKk",
      youtubeTitle: "Neural Networks Full Series (3Blue1Brown)"
    },
    {
      id: "ai-6",
      name: "Natural Language Processing, LLMs, & Gemini API",
      category: "Generative AI",
      difficulty: "Advanced",
      duration: "3 weeks",
      description: "Interact with Google Gemini API models, implement LangChain architectures, structure semantic embedding vectors with databases, and architect custom Retrieval-Augmented Generation (RAG) agents.",
      youtubeUrl: "https://www.youtube.com/watch?v=lG7Uxts9SXs",
      youtubeTitle: "LangChain Course for Beginners (freeCodeCamp)"
    },
    {
      id: "ai-7",
      name: "Capstone Project: AI-Powered Predictive Analytics Agent",
      category: "Projects",
      difficulty: "Advanced",
      duration: "3 weeks",
      description: "Synthesize your AI knowledge: design, containerize, and deploy an autonomous microservice agent that reads active stream feeds to generate forecasted analytics.",
      youtubeUrl: "https://www.youtube.com/watch?v=mjKsgK21G68",
      youtubeTitle: "End-to-End Machine Learning Project with Deployment (Krish Naik)"
    }
  ],
  "Web Developer": [
    {
      id: "web-1",
      name: "HTML5, CSS3, Semantic markup & Responsive Design",
      category: "Frontend Basics",
      difficulty: "Beginner",
      duration: "2 weeks",
      description: "Establish semantic document structure, master document layouts using CSS Flexbox and CSS Grid, implement fluid responsive designs, and employ media queries and standard accessible design.",
      youtubeUrl: "https://www.youtube.com/watch?v=mJgBOIoGihA",
      youtubeTitle: "HTML & CSS Full Course for Beginners (Dave Gray)"
    },
    {
      id: "web-2",
      name: "Modern JavaScript (ES6+, DOM Manipulation, Fetch API)",
      category: "JavaScript",
      difficulty: "Beginner",
      duration: "3 weeks",
      description: "Acquire intermediate fluency in ES6+ syntax options, functional tools (map, filter, reduce), dynamic browser DOM manipulations, Promises, and handle REST operations using async/await.",
      youtubeUrl: "https://www.youtube.com/watch?v=SBmSRK3vW_Y",
      youtubeTitle: "JavaScript Full Course for Beginners (SuperSimpleDev)"
    },
    {
      id: "web-3",
      name: "Tailwind CSS & Component Library Integration (shadcn, Radix)",
      category: "Styling",
      difficulty: "Intermediate",
      duration: "1 week",
      description: "Quickly construct stunning custom interfaces with utility-first Tailwind CSS. Configure themes, design dynamic responsive panels, and create custom UI setups using unstyled primitive nodes.",
      youtubeUrl: "https://www.youtube.com/watch?v=lCscg8XGk1M",
      youtubeTitle: "Tailwind CSS Course for Beginners (Dave Gray)"
    },
    {
      id: "web-4",
      name: "React.js Framework (Hooks, State Management, Router)",
      category: "React",
      difficulty: "Intermediate",
      duration: "4 weeks",
      description: "Unlock component-driven development. Master local component state, props passing, hooks (useState, useEffect, useMemo), React Context, and navigation structures.",
      youtubeUrl: "https://www.youtube.com/watch?v=Ke90Tje7VS0",
      youtubeTitle: "React JS Tutorial for Beginners (Programming with Mosh)"
    },
    {
      id: "web-5",
      name: "Backend Basics: Node.js, Express, REST APIs",
      category: "Backend",
      difficulty: "Intermediate",
      duration: "3 weeks",
      description: "Construct fast server architectures. Create modular Express routers, sanitization middlewares, configure headers and CORS options, and output standard, consistent API endpoints.",
      youtubeUrl: "https://www.youtube.com/watch?v=Oe421EPjeMI",
      youtubeTitle: "Node.js & Express Full Tutorial Course (freeCodeCamp)"
    },
    {
      id: "web-6",
      name: "Database Connections (Firestore / SQL & Query logic)",
      category: "Database",
      difficulty: "Intermediate",
      duration: "2 weeks",
      description: "Study structural database schemas, manage collections and records, write optimized queries, handle indexing, and perform secure relational transactions.",
      youtubeUrl: "https://www.youtube.com/watch?v=9zdvmgGhsPQ",
      youtubeTitle: "Firebase & Firestore Web Course Tutorial (Net Ninja)"
    },
    {
      id: "web-7",
      name: "Deployment, CI/CD, and Hosting (Cloud Run, Vercel)",
      category: "DevOps",
      difficulty: "Advanced",
      duration: "2 weeks",
      description: "Prepare application builds, configure automated deployment triggers via GitHub pipelines, and deploy server containers or client web products to live cloud hosting environments.",
      youtubeUrl: "https://www.youtube.com/watch?v=R8_veQiYBhI",
      youtubeTitle: "GitHub Actions CI/CD Pipeline Tutorial for Beginners"
    }
  ],
  "Mobile Developer": [
    {
      id: "mob-1",
      name: "Swift/Kotlin Programming Language Foundations",
      category: "Language Basics",
      difficulty: "Beginner",
      duration: "3 weeks",
      description: "Study key modern language tenets: type systems, safety concepts (Swift optionals vs Kotlin null-safety), collections, object-oriented/functional models, and syntax formats.",
      youtubeUrl: "https://www.youtube.com/watch?v=EExSSotojxs",
      youtubeTitle: "Kotlin Course for Beginners (freeCodeCamp)"
    },
    {
      id: "mob-2",
      name: "Declarative UI Frameworks (SwiftUI / Jetpack Compose)",
      category: "UI Design",
      difficulty: "Intermediate",
      duration: "4 weeks",
      description: "Design mobile layouts using declarative styles. Build reusable components, handle states, arrange screens, manage responsive text grids, and implement elegant micro-animations.",
      youtubeUrl: "https://www.youtube.com/watch?v=cD_IeM5YIOM",
      youtubeTitle: "Jetpack Compose Full Course (Philipp Lackner)"
    },
    {
      id: "mob-3",
      name: "Cross-Platform Framework Alternatives (Flutter / React Native)",
      category: "Cross Platform",
      difficulty: "Intermediate",
      duration: "4 weeks",
      description: "Develop unified solutions. Learn Flutter's customizable Widget trees or build JavaScript-based structures with React Native for consistent cross-platform products.",
      youtubeUrl: "https://www.youtube.com/watch?v=x0uinJvhNxI",
      youtubeTitle: "Flutter Course for Beginners (freeCodeCamp)"
    },
    {
      id: "mob-4",
      name: "State Management & Device Storage",
      category: "Architecture",
      difficulty: "Intermediate",
      duration: "2 weeks",
      description: "Structure secure local caching. Implement SQLite access layers with libraries like Room or CoreData, and coordinate architecture state strategies.",
      youtubeUrl: "https://www.youtube.com/watch?v=ihshS9_e9Xg",
      youtubeTitle: "Android Room Database & MVVM Tutorial (Philipp Lackner)"
    },
    {
      id: "mob-5",
      name: "Network Requests & API Integrations",
      category: "Data Fetching",
      difficulty: "Intermediate",
      duration: "2 weeks",
      description: "Integrate remote JSON web servers. Utilize engines (Retrofit / URLSession), parse data entities, gracefully manage slow connections, and secure API transport networks.",
      youtubeUrl: "https://www.youtube.com/watch?v=t8X9K3r6M98",
      youtubeTitle: "Retrofit Network API Calls in Android Kotlin (Philipp Lackner)"
    },
    {
      id: "mob-6",
      name: "Mobile App Store Prep & Deployment Processes",
      category: "Release",
      difficulty: "Advanced",
      duration: "2 weeks",
      description: "Code sign application binaries with credentials. Create test channels, construct store detail templates, and navigate deployment procedures on Apple App Store & Google Play Console.",
      youtubeUrl: "https://www.youtube.com/watch?v=GekyP-4_96U",
      youtubeTitle: "How to Publish Your First Android App on Google Play Store"
    }
  ],
  "Cloud Engineer": [
    {
      id: "cld-1",
      name: "Linux Systems, Command Line, & Shell Scripting",
      category: "OS Basics",
      difficulty: "Beginner",
      duration: "3 weeks",
      description: "Explore Linux internals, directory structures, user access privileges, daemon processes, package managers, and program automation with Bash scripts.",
      youtubeUrl: "https://www.youtube.com/watch?v=sWbUDq4S_Sg",
      youtubeTitle: "Linux Command Line Tutorial for Beginners (freeCodeCamp)"
    },
    {
      id: "cld-2",
      name: "Computer Networking Protocols (TCP/IP, DNS, VPC)",
      category: "Networking",
      difficulty: "Intermediate",
      duration: "3 weeks",
      description: "Configure custom virtual private networks (VPCs), manage routing tables, subnet structures, load balancers, firewalls, and address allocation ranges.",
      youtubeUrl: "https://www.youtube.com/watch?v=qiYvIrc_r_A",
      youtubeTitle: "Free CCNA Network Fundamentals Series (NetworkChuck)"
    },
    {
      id: "cld-3",
      name: "Docker Containerization & Multi-stage Builds",
      category: "Containers",
      difficulty: "Intermediate",
      duration: "2 weeks",
      description: "Containerize applications using Docker. Create lightweight production images with multi-stage builds, manage persistent volumes, and map container networking protocols.",
      youtubeUrl: "https://www.youtube.com/watch?v=3c_iQqg647A",
      youtubeTitle: "Docker Full Tutorial for Beginners (TechWorld with Nana)"
    },
    {
      id: "cld-4",
      name: "Kubernetes Orchestration & Helm Chart Management",
      category: "Orchestration",
      difficulty: "Advanced",
      duration: "4 weeks",
      description: "Deploy large container schemes. Manage Pod lifecycles, configure Kubernetes services, handle ingresses, manage volumes, secrets, and template configurations with Helm Charts.",
      youtubeUrl: "https://www.youtube.com/watch?v=X48VuDVv0do",
      youtubeTitle: "Kubernetes Tutorial for Beginners (TechWorld with Nana)"
    },
    {
      id: "cld-5",
      name: "Infrastructure as Code (Terraform) and AWS/GCP Platforms",
      category: "Cloud Core",
      difficulty: "Advanced",
      duration: "4 weeks",
      description: "Maintain immutable infrastructure blueprints declaratively with Terraform. Connect cloud instances, provision server networks, and configure global databases seamlessly.",
      youtubeUrl: "https://www.youtube.com/watch?v=hsn9xAzv3OM",
      youtubeTitle: "Terraform Course for Beginners (freeCodeCamp)"
    },
    {
      id: "cld-6",
      name: "CI/CD Pipeline Design (GitHub Actions / GitLab CI)",
      category: "DevOps",
      difficulty: "Advanced",
      duration: "2 weeks",
      description: "Create modern pipelines using YAML configurations. Automatically build, test, scan images for bugs, and implement zero-downtime deployment strategies.",
      youtubeUrl: "https://www.youtube.com/watch?v=R8_veQiYBhI",
      youtubeTitle: "GitHub Actions Beginners Guide (TechWorld with Nana)"
    }
  ]
};

export interface TrendingCourse {
  title: string;
  provider: string;
  rating: number;
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  url: string;
  description: string;
}

export const trendingCoursesByRole: Record<string, TrendingCourse[]> = {
  "AI Engineer": [
    {
      title: "Generative AI for Beginners",
      provider: "Microsoft",
      rating: 4.9,
      duration: "18 hours",
      difficulty: "Beginner",
      url: "https://github.com/microsoft/generative-ai-for-beginners",
      description: "A comprehensive 18-lesson course teaching the fundamentals of building Generative AI applications using Azure, OpenAI, and LangChain."
    },
    {
      title: "Deep Learning Specialization",
      provider: "DeepLearning.AI",
      rating: 4.8,
      duration: "3 months",
      difficulty: "Intermediate",
      url: "https://www.youtube.com/playlist?list=PLpZ2Z0At_m6P7_N7T9SOf_PLskit-p8M5",
      description: "Master the foundations of Deep Learning, structure machine learning projects, and build convolutional and sequential neural networks."
    },
    {
      title: "Machine Learning Zoomcamp",
      provider: "DataTalksClub",
      rating: 4.7,
      duration: "12 weeks",
      difficulty: "Intermediate",
      url: "https://github.com/DataTalksClub/machine-learning-zoomcamp",
      description: "A highly practical, hands-on engineering-focused introduction to machine learning, model selection, deployment, and cloud serving."
    }
  ],
  "Web Developer": [
    {
      title: "Full Stack Open 2026",
      provider: "University of Helsinki",
      rating: 4.9,
      duration: "120 hours",
      difficulty: "Intermediate",
      url: "https://fullstackopen.com/en/",
      description: "Learn React, Redux, Node.js, MongoDB, GraphQL, and TypeScript in this deep dive into modern full-stack web development."
    },
    {
      title: "The Odin Project",
      provider: "Open Source Community",
      rating: 4.8,
      duration: "Self-paced",
      difficulty: "Beginner",
      url: "https://www.theodinproject.com/",
      description: "A premier free, open-source full-stack curriculum covering HTML, CSS, JavaScript, Ruby on Rails, and React with extreme hands-on focus."
    },
    {
      title: "Modern React with Redux",
      provider: "Stephen Grider / freeCodeCamp",
      rating: 4.7,
      duration: "40 hours",
      difficulty: "Intermediate",
      url: "https://www.youtube.com/watch?v=Ke90Tje7VS0",
      description: "Deep dive into component composition, state hooks, React Router v6, data fetching, and central architecture state managers."
    }
  ],
  "Mobile Developer": [
    {
      title: "100 Days of SwiftUI",
      provider: "Hacking with Swift",
      rating: 4.9,
      duration: "100 days",
      difficulty: "Beginner",
      url: "https://www.hackingwithswift.com/100/swiftui",
      description: "The gold standard curriculum for learning modern declarative iOS development in Swift, completely free and project-based."
    },
    {
      title: "Android Basics with Compose",
      provider: "Google Developer Training",
      rating: 4.8,
      duration: "60 hours",
      difficulty: "Beginner",
      url: "https://developer.android.com/courses/android-basics-compose/course",
      description: "Learn how to build real Android applications using Jetpack Compose, Kotlin, navigation, database persistence, and material design."
    },
    {
      title: "Flutter & Dart Complete Course",
      provider: "freeCodeCamp",
      rating: 4.7,
      duration: "35 hours",
      difficulty: "Intermediate",
      url: "https://www.youtube.com/watch?v=VPvVD8t026U",
      description: "Master cross-platform mobile development for iOS and Android using the Dart language and dynamic Flutter widget layouts."
    }
  ],
  "Cloud Engineer": [
    {
      title: "AWS Solutions Architect Certification",
      provider: "freeCodeCamp & Andrew Brown",
      rating: 4.9,
      duration: "24 hours",
      difficulty: "Intermediate",
      url: "https://www.youtube.com/watch?v=Ia-UEYYR44s",
      description: "Fully comprehensive exam prep guide covering VPC networking, EC2 compute scaling, IAM security, S3 storage, and RDS database designs."
    },
    {
      title: "Google Associate Cloud Engineer Course",
      provider: "freeCodeCamp",
      rating: 4.8,
      duration: "15 hours",
      difficulty: "Beginner",
      url: "https://www.youtube.com/watch?v=8mGfSby6_u4",
      description: "Master GCP platform components: Google Compute Engine, Kubernetes Engine GKE, Cloud Run container serving, and IAM privileges."
    },
    {
      title: "DevOps & SRE Bootcamp",
      provider: "TechWorld with Nana",
      rating: 4.9,
      duration: "45 hours",
      difficulty: "Advanced",
      url: "https://www.youtube.com/watch?v=X48VuDVv0do",
      description: "Deep dive into real-world SRE tooling: Linux basics, Docker container management, CI/CD automated pipelines, and Kubernetes setups."
    }
  ]
};
