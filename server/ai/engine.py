#!/usr/bin/env python3
import json
import math
import re
import sys
from collections import Counter
from typing import Any, Dict, List, Optional


SKILL_KEYWORDS: Dict[str, List[str]] = {
    "programming": [
        "javascript", "typescript", "python", "java", "c++", "c#", "ruby", "go", "golang",
        "rust", "swift", "kotlin", "php", "scala", "r", "matlab", "perl", "dart", "lua",
        "html", "css", "sql", "bash", "shell", "powershell",
    ],
    "framework": [
        "react", "react.js", "reactjs", "angular", "vue", "vue.js", "vuejs", "next.js",
        "nextjs", "nuxt", "svelte", "express", "express.js", "fastapi", "django", "flask",
        "spring", "spring boot", "rails", "ruby on rails", "laravel", ".net", "asp.net",
        "node.js", "nodejs", "nest.js", "nestjs", "gatsby", "remix", "tailwind",
        "tailwindcss", "bootstrap", "material ui", "chakra ui",
    ],
    "database": [
        "mongodb", "postgresql", "postgres", "mysql", "sqlite", "redis", "elasticsearch",
        "dynamodb", "cassandra", "oracle", "sql server", "firebase", "firestore", "supabase",
        "neo4j", "couchdb", "mariadb",
    ],
    "cloud": [
        "aws", "amazon web services", "azure", "google cloud", "gcp", "heroku", "vercel",
        "netlify", "digitalocean", "cloudflare", "lambda", "s3", "ec2", "ecs", "eks",
    ],
    "devops": [
        "docker", "kubernetes", "k8s", "jenkins", "ci/cd", "github actions", "gitlab ci",
        "terraform", "ansible", "nginx", "apache", "linux", "git", "github", "gitlab",
        "bitbucket", "prometheus", "grafana",
    ],
    "data-science": [
        "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "keras", "matplotlib",
        "seaborn", "jupyter", "data analysis", "data visualization", "machine learning",
        "deep learning", "nlp", "natural language processing", "computer vision",
        "statistics", "big data", "spark", "hadoop", "tableau", "power bi",
    ],
    "ai-ml": [
        "artificial intelligence", "neural networks", "transformers", "bert", "gpt",
        "llm", "large language models", "reinforcement learning", "generative ai",
        "langchain", "hugging face", "openai", "chatgpt",
    ],
    "testing": [
        "jest", "mocha", "cypress", "selenium", "playwright", "junit", "pytest",
        "unit testing", "integration testing", "e2e testing", "test automation",
    ],
    "mobile": [
        "react native", "flutter", "ios", "android", "swift", "swiftui", "xcode",
        "android studio", "expo",
    ],
    "soft-skill": [
        "leadership", "communication", "teamwork", "problem solving", "agile",
        "scrum", "project management", "time management", "critical thinking",
        "collaboration", "mentoring",
    ],
}

SKILL_ALIASES: Dict[str, List[str]] = {
    "node.js": ["nodejs", "node"],
    "next.js": ["nextjs", "next"],
    "react native": ["react-native"],
    "vue": ["vue.js", "vuejs"],
    "c++": ["cpp"],
    "c#": ["csharp", "c-sharp"],
    "ci/cd": ["cicd", "ci cd"],
    "spring boot": ["springboot", "spring-boot"],
    "scikit-learn": ["sklearn", "scikit learn"],
    "power bi": ["powerbi", "power-bi"],
    "google cloud": ["gcp", "google-cloud"],
    "nlp": ["natural language processing"],
    "artificial intelligence": ["ai"],
}

CERT_KEYWORDS = [
    "aws certified", "google certified", "microsoft certified", "azure",
    "comptia", "cisco", "ccna", "ccnp", "pmp", "scrum master", "csm",
    "certified kubernetes", "cka", "ckad", "terraform associate",
    "solutions architect", "developer associate", "data engineer",
    "machine learning specialty", "oracle certified", "itil",
    "six sigma", "safe agilist",
]

FACTOR_WEIGHTS = {
    "skillFit": 0.60,
    "demand": 0.20,
    "growth": 0.20,
}

DEMAND_SCORES = {
    "high": 100,
    "medium": 60,
    "low": 30,
}

ALIAS_TO_CANONICAL: Dict[str, str] = {}
for canonical, aliases in SKILL_ALIASES.items():
    ALIAS_TO_CANONICAL[canonical] = canonical
    for alias in aliases:
        ALIAS_TO_CANONICAL[alias] = canonical

SEARCH_TERMS: Dict[str, str] = {}
for category_skills in SKILL_KEYWORDS.values():
    for skill in category_skills:
        SEARCH_TERMS[skill] = ALIAS_TO_CANONICAL.get(skill, skill)
for alias, canonical in ALIAS_TO_CANONICAL.items():
    SEARCH_TERMS[alias] = canonical


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").strip().lower())


def normalize_skill(value: str) -> str:
    normalized = normalize_text(value)
    return ALIAS_TO_CANONICAL.get(normalized, normalized)


def unique_preserve(values: List[str]) -> List[str]:
    seen = set()
    unique_values: List[str] = []
    for value in values:
        key = normalize_skill(value)
        if not key or key in seen:
            continue
        seen.add(key)
        unique_values.append(key)
    return unique_values


def search_pattern(term: str) -> re.Pattern[str]:
    escaped = re.escape(term).replace(r"\ ", r"\s+")
    return re.compile(rf"(?<![A-Za-z0-9]){escaped}(?![A-Za-z0-9])", re.IGNORECASE)


def extract_skills(text: str) -> List[str]:
    found: List[str] = []
    for term, canonical in SEARCH_TERMS.items():
        if search_pattern(term).search(text):
            found.append(canonical)
    return unique_preserve(found)


def extract_summary(text: str) -> str:
    match = re.search(
        r"(?:summary|objective|about|profile|overview)[\s:]*\n([\s\S]*?)(?=\n(?:experience|education|skills|$))",
        text,
        re.IGNORECASE,
    )
    if match:
        return match.group(1).strip()[:500]

    paragraphs = [part.strip() for part in re.split(r"\n\s*\n", text) if part.strip()]
    if paragraphs and len(paragraphs[0]) > 50:
        return paragraphs[0][:500]
    return ""


def extract_certifications(text: str) -> List[str]:
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    certifications: List[str] = []

    for keyword in CERT_KEYWORDS:
        for line in lines:
            if keyword in line.lower():
                certifications.append(line)
                break

    return unique_preserve(certifications)


def extract_education(text: str) -> List[Dict[str, Any]]:
    degree_patterns = [
        re.compile(r"\b(?:bachelor|b\.?s\.?|b\.?a\.?|b\.?tech|b\.?e\.?|b\.?sc)\b", re.IGNORECASE),
        re.compile(r"\b(?:master|m\.?s\.?|m\.?a\.?|m\.?tech|m\.?e\.?|m\.?sc|mba)\b", re.IGNORECASE),
        re.compile(r"\b(?:ph\.?d|doctorate|doctor)\b", re.IGNORECASE),
        re.compile(r"\b(?:diploma|associate|certificate)\b", re.IGNORECASE),
    ]

    education: List[Dict[str, Any]] = []
    lines = text.split("\n")
    for index, line in enumerate(lines):
        if any(pattern.search(line) for pattern in degree_patterns):
            year_match = re.search(r"\b(19|20)\d{2}\b", line)
            education.append(
                {
                    "degree": line.strip(),
                    "field": "",
                    "institution": (lines[index + 1].strip() if index + 1 < len(lines) else ""),
                    "year": int(year_match.group(0)) if year_match else None,
                }
            )
    return education


def extract_experience(text: str) -> List[Dict[str, str]]:
    experiences: List[Dict[str, str]] = []
    section_match = re.search(
        r"(?:experience|work\s*history|employment|professional\s*background)[\s:]*\n([\s\S]*?)(?=\n(?:education|skills|certifications|projects|awards|references|$))",
        text,
        re.IGNORECASE,
    )

    if section_match:
        section = section_match.group(1)
        entry_pattern = re.compile(
            r"(.+?)\s*(?:at|@|-|–|,)\s*(.+?)\s*(?:\||–|-|,)\s*(.+?)(?:\n([\s\S]*?))?(?=\n[A-Z]|\n\n|$)"
        )
        for match in entry_pattern.finditer(section):
            experiences.append(
                {
                    "title": (match.group(1) or "").strip(),
                    "company": (match.group(2) or "").strip(),
                    "duration": (match.group(3) or "").strip(),
                    "description": (match.group(4) or "").strip(),
                }
            )

    if experiences:
        return experiences

    for match in re.finditer(r"(\d{4})\s*(?:-|–|to)\s*(?:(\d{4})|present|current)", text, re.IGNORECASE):
        context_start = max(0, match.start() - 200)
        context = text[context_start:match.start()]
        lines = [line.strip() for line in context.split("\n") if line.strip()]
        if not lines:
            continue
        experiences.append(
            {
                "title": lines[-1],
                "company": "",
                "duration": match.group(0),
                "description": "",
            }
        )

    return experiences


def parse_resume(payload: Dict[str, Any]) -> Dict[str, Any]:
    raw_text = (payload.get("rawText") or "").replace("\r\n", "\n").replace("\r", "\n")
    return {
        "skills": extract_skills(raw_text.lower()),
        "experience": extract_experience(raw_text),
        "education": extract_education(raw_text),
        "certifications": extract_certifications(raw_text),
        "summary": extract_summary(raw_text),
    }


def skills_match(a: str, b: str) -> bool:
    return normalize_skill(a) == normalize_skill(b)


def user_has_skill(user_skills: List[str], target: str) -> bool:
    target_normalized = normalize_skill(target)
    return any(normalize_skill(skill) == target_normalized for skill in user_skills)


def estimate_proficiency(skill_name: str, user_skills: List[str], skill_docs: List[Dict[str, Any]]) -> str:
    skill_doc = next((doc for doc in skill_docs if skills_match(doc.get("name", ""), skill_name)), None)
    if not skill_doc:
        return "beginner"

    related_skills = skill_doc.get("relatedSkills") or []
    if not related_skills:
        return "intermediate"

    related_owned = sum(1 for related in related_skills if user_has_skill(user_skills, related))
    ratio = related_owned / len(related_skills)

    if ratio >= 0.6:
        return "advanced"
    if ratio >= 0.3:
        return "intermediate"
    return "beginner"


def dedupe_skills(values: List[str]) -> List[str]:
    return unique_preserve(values)


def build_skill_universe(careers: List[Dict[str, Any]], skill_docs: List[Dict[str, Any]], extra_skills: List[str]) -> List[str]:
    universe = list(extra_skills)
    universe.extend(skill.get("name", "") for skill in skill_docs)
    for career in careers:
        universe.extend(career.get("requiredSkills") or [])
        universe.extend(career.get("optionalSkills") or [])
    return dedupe_skills(universe)


def build_idf_map(careers: List[Dict[str, Any]], skill_universe: List[str]) -> Dict[str, float]:
    total_docs = max(1, len(careers))
    idf_map: Dict[str, float] = {}

    for skill in skill_universe:
        doc_frequency = 0
        for career in careers:
            career_skills = dedupe_skills((career.get("requiredSkills") or []) + (career.get("optionalSkills") or []))
            if user_has_skill(career_skills, skill):
                doc_frequency += 1
        idf_map[skill] = math.log((1 + total_docs) / (1 + doc_frequency)) + 1

    return idf_map


def build_user_vector(user_skills: List[str], skill_universe: List[str], idf_map: Dict[str, float]) -> List[float]:
    normalized_user_skills = dedupe_skills(user_skills)
    document_length = max(1, len(normalized_user_skills))
    counts = Counter(normalize_skill(skill) for skill in normalized_user_skills)

    vector: List[float] = []
    for skill in skill_universe:
        frequency = counts.get(normalize_skill(skill), 0)
        tf = frequency / document_length
        vector.append(tf * idf_map.get(skill, 0.0))
    return vector


def build_career_vector(career: Dict[str, Any], skill_universe: List[str], idf_map: Dict[str, float]) -> List[float]:
    required_skills = dedupe_skills(career.get("requiredSkills") or [])
    optional_skills = dedupe_skills(career.get("optionalSkills") or [])
    weighted_tokens = required_skills + required_skills + optional_skills
    document_length = max(1, len(weighted_tokens))
    counts = Counter(normalize_skill(skill) for skill in weighted_tokens)

    vector: List[float] = []
    for skill in skill_universe:
        frequency = counts.get(normalize_skill(skill), 0)
        tf = frequency / document_length
        vector.append(tf * idf_map.get(skill, 0.0))
    return vector


def cosine_similarity(vector_a: List[float], vector_b: List[float]) -> float:
    dot = sum(a * b for a, b in zip(vector_a, vector_b))
    magnitude_a = math.sqrt(sum(value * value for value in vector_a))
    magnitude_b = math.sqrt(sum(value * value for value in vector_b))
    denominator = magnitude_a * magnitude_b
    if denominator == 0:
        return 0.0
    return dot / denominator


def estimate_growth_score(growth_outlook: str) -> int:
    text = normalize_text(growth_outlook)
    positive_words = ["strong", "excellent", "explosive", "rapid", "high", "growing", "abundant"]
    neutral_words = ["steady", "consistent", "stable", "moderate"]
    negative_words = ["declining", "shrinking", "limited", "low"]

    score = 50
    for word in positive_words:
        if word in text:
            score += 10
    for word in neutral_words:
        if word in text:
            score += 3
    for word in negative_words:
        if word in text:
            score -= 15
    return max(0, min(100, score))


def generate_explanation(career: Dict[str, Any], matched_skills: List[str], missing_skills: List[str], match_score: int, strongest_factor: Dict[str, Any]) -> str:
    title = career.get("title", "this career")
    parts: List[str] = []

    if match_score >= 70:
        parts.append(f"You are a strong match for {title} with {match_score}% compatibility.")
    elif match_score >= 40:
        parts.append(f"You are a moderate match for {title} with {match_score}% compatibility.")
    else:
        parts.append(f"{title} could be a stretch goal with {match_score}% current compatibility.")

    if matched_skills:
        parts.append(f"Your relevant skills include: {', '.join(matched_skills[:5])}.")

    if missing_skills:
        parts.append(f"Key skills to develop: {', '.join(missing_skills[:5])}.")

    parts.append(f"Your strongest factor is {strongest_factor['factor']} ({strongest_factor['score']}%).")
    return " ".join(parts)


def analyze_skill_gap(payload: Dict[str, Any]) -> Dict[str, Any]:
    user_skills = dedupe_skills(payload.get("userSkills") or [])
    all_careers = payload.get("careers") or []
    skill_docs = payload.get("skills") or []
    career_path_id = payload.get("careerPathId")

    selected_career = next((career for career in all_careers if str(career.get("_id")) == str(career_path_id)), None)

    if selected_career:
        required_skill_names = dedupe_skills((selected_career.get("requiredSkills") or []) + (selected_career.get("optionalSkills") or []))
        required_only = dedupe_skills(selected_career.get("requiredSkills") or [])
    else:
        required_skill_names = dedupe_skills([
            skill.get("name", "")
            for skill in skill_docs
            if normalize_text(skill.get("demandLevel", "")) == "high"
        ])
        required_only = list(required_skill_names)

    skill_universe = build_skill_universe(all_careers, skill_docs, required_skill_names)
    idf_map = build_idf_map(all_careers, skill_universe)

    matched_skills: List[Dict[str, Any]] = []
    missing_skills: List[Dict[str, Any]] = []

    for required_skill in required_skill_names:
        skill_doc = next((doc for doc in skill_docs if skills_match(doc.get("name", ""), required_skill)), None)
        weight = 2 if user_has_skill(required_only, required_skill) else 1
        tfidf = round(idf_map.get(normalize_skill(required_skill), 0.0) * weight, 4)
        category = skill_doc.get("category") if skill_doc else "other"
        demand_level = skill_doc.get("demandLevel") if skill_doc else "medium"

        skill_entry = {
            "skill": normalize_skill(required_skill),
            "tfidf": tfidf,
            "category": category,
            "demandLevel": demand_level,
            "proficiency": estimate_proficiency(required_skill, user_skills, skill_docs),
        }

        if user_has_skill(user_skills, required_skill):
            matched_skills.append(skill_entry)
        else:
            skill_entry["proficiency"] = "beginner"
            missing_skills.append(skill_entry)

    total_weight = sum(entry["tfidf"] for entry in matched_skills + missing_skills)
    matched_weight = sum(entry["tfidf"] for entry in matched_skills)
    if total_weight > 0:
        match_score = round((matched_weight / total_weight) * 100)
    else:
        match_score = 100 if not required_skill_names else 0

    gap_percentage = round((len(missing_skills) / len(required_skill_names)) * 100) if required_skill_names else 0

    category_map: Dict[str, Dict[str, Any]] = {}
    for entry in matched_skills + missing_skills:
        category = entry["category"]
        category_bucket = category_map.setdefault(
            category,
            {
                "category": category,
                "total": 0,
                "matched": 0,
                "missing": [],
                "proficiencyDistribution": {
                    "beginner": 0,
                    "intermediate": 0,
                    "advanced": 0,
                },
            },
        )
        category_bucket["total"] += 1

        if any(item["skill"] == entry["skill"] for item in matched_skills):
            category_bucket["matched"] += 1
            category_bucket["proficiencyDistribution"][entry["proficiency"]] += 1
        else:
            category_bucket["missing"].append(entry["skill"])

    return {
        "currentSkills": user_skills,
        "requiredSkills": [normalize_skill(skill) for skill in required_skill_names],
        "matchedSkills": matched_skills,
        "missingSkills": missing_skills,
        "matchScore": match_score,
        "gapPercentage": gap_percentage,
        "categoryBreakdown": list(category_map.values()),
    }


def recommend_careers(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    user_skills = dedupe_skills(payload.get("userSkills") or [])
    all_careers = payload.get("careers") or []
    skill_docs = payload.get("skills") or []

    skill_universe = build_skill_universe(all_careers, skill_docs, user_skills)
    idf_map = build_idf_map(all_careers, skill_universe)
    user_vector = build_user_vector(user_skills, skill_universe, idf_map)

    matches: List[Dict[str, Any]] = []

    for career in all_careers:
        required_skills = dedupe_skills(career.get("requiredSkills") or [])
        optional_skills = dedupe_skills(career.get("optionalSkills") or [])
        all_career_skills = dedupe_skills(required_skills + optional_skills)

        matched_skills = [skill for skill in user_skills if user_has_skill(all_career_skills, skill)]
        missing_skills = [skill for skill in required_skills if not user_has_skill(user_skills, skill)]

        career_vector = build_career_vector(career, skill_universe, idf_map)
        cosine = cosine_similarity(user_vector, career_vector)
        coverage = (len(required_skills) - len(missing_skills)) / len(required_skills) if required_skills else 1.0
        overlap = len(matched_skills) / len(all_career_skills) if all_career_skills else 1.0

        semantic_similarity = (cosine * 0.7) + (coverage * 0.2) + (overlap * 0.1)
        skill_fit_score = round(semantic_similarity * 100)
        demand_score = DEMAND_SCORES.get(normalize_text(career.get("demandLevel", "")), 50)
        growth_score = estimate_growth_score(career.get("growthOutlook", ""))

        match_score = round(
            skill_fit_score * FACTOR_WEIGHTS["skillFit"]
            + demand_score * FACTOR_WEIGHTS["demand"]
            + growth_score * FACTOR_WEIGHTS["growth"]
        )

        factors = [
            {
                "factor": "Skill Fit",
                "score": skill_fit_score,
                "maxScore": 100,
                "weight": FACTOR_WEIGHTS["skillFit"],
                "description": f"Combines TF-IDF cosine similarity with required-skill coverage ({round(coverage * 100)}%) and keyword overlap ({round(overlap * 100)}%).",
            },
            {
                "factor": "Market Demand",
                "score": demand_score,
                "maxScore": 100,
                "weight": FACTOR_WEIGHTS["demand"],
                "description": f"This career has {career.get('demandLevel', 'medium')} market demand.",
            },
            {
                "factor": "Growth Outlook",
                "score": growth_score,
                "maxScore": 100,
                "weight": FACTOR_WEIGHTS["growth"],
                "description": career.get("growthOutlook") or "No growth data available.",
            },
        ]

        strongest_factor = max(factors, key=lambda factor: factor["score"] * factor["weight"])
        explanation = generate_explanation(career, matched_skills, missing_skills, match_score, strongest_factor)

        matches.append(
            {
                "careerPathId": str(career.get("_id")),
                "matchScore": match_score,
                "skillFitScore": skill_fit_score,
                "demandScore": demand_score,
                "growthScore": growth_score,
                "matchedSkills": matched_skills,
                "missingSkills": missing_skills,
                "explanation": explanation,
                "factors": factors,
                "cosineSimilarity": round(cosine, 3),
            }
        )

    matches.sort(key=lambda item: (item["matchScore"], item["skillFitScore"]), reverse=True)
    return matches[:10]


def respond(data: Any) -> None:
    print(json.dumps({"success": True, "data": data}))


def fail(message: str) -> None:
    print(json.dumps({"success": False, "error": message}))


def main() -> None:
    if len(sys.argv) < 2:
        fail("No action provided.")
        sys.exit(1)

    action = sys.argv[1]
    raw_input = sys.stdin.read() or "{}"

    try:
        payload = json.loads(raw_input)
    except json.JSONDecodeError as error:
        fail(f"Invalid JSON payload: {error}")
        sys.exit(1)

    try:
        if action == "parse_resume":
            respond(parse_resume(payload))
        elif action == "analyze_skill_gap":
            respond(analyze_skill_gap(payload))
        elif action == "recommend_careers":
            respond(recommend_careers(payload))
        else:
            fail(f"Unsupported action: {action}")
            sys.exit(1)
    except Exception as error:  # pragma: no cover - defensive runtime guard
        fail(str(error))
        sys.exit(1)


if __name__ == "__main__":
    main()
