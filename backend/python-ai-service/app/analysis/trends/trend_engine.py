from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone

from pydantic import BaseModel

from app.normalization.models import NormalizedPost


class TrendCluster(BaseModel):
    topic_label: str
    direction: str  # RISING | STABLE | DECLINING
    momentum_score: float
    post_count: int
    peak_day: str


def detect_trends(posts: list[NormalizedPost]) -> list[TrendCluster]:
    if len(posts) < 3:
        return []

    now = datetime.now(tz=timezone.utc)
    today = now.date()

    # Group posts by day
    by_day: defaultdict[str, list[NormalizedPost]] = defaultdict(list)
    for p in posts:
        day = p.created_at.date().isoformat()
        by_day[day].append(p)

    # Compute volumes for last 7 days
    last_3 = []
    prev_4_to_7 = []
    for offset in range(7):
        day = (today - timedelta(days=offset)).isoformat()
        count = len(by_day.get(day, []))
        if offset < 3:
            last_3.append(count)
        else:
            prev_4_to_7.append(count)

    avg_recent = sum(last_3) / max(len(last_3), 1)
    avg_prev = sum(prev_4_to_7) / max(len(prev_4_to_7), 1)
    momentum = (avg_recent - avg_prev) / max(avg_prev, 1)

    if momentum > 0.3:
        direction = "RISING"
    elif momentum < -0.2:
        direction = "DECLINING"
    else:
        direction = "STABLE"

    # Find peak day
    peak_day = max(by_day.keys(), key=lambda d: len(by_day[d])) if by_day else today.isoformat()

    # Extract topic label from most common words
    topic_label = _extract_topic_label(posts)

    cluster = TrendCluster(
        topic_label=topic_label,
        direction=direction,
        momentum_score=round(momentum, 3),
        post_count=len(posts),
        peak_day=peak_day,
    )

    return [cluster]


def _extract_topic_label(posts: list[NormalizedPost], top_n: int = 3) -> str:
    stop_words = {
        "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
        "have", "has", "had", "do", "does", "did", "will", "would", "could",
        "should", "may", "might", "shall", "can", "need", "dare", "ought",
        "to", "of", "in", "for", "on", "with", "at", "by", "from", "as",
        "into", "through", "during", "before", "after", "above", "below",
        "between", "out", "off", "over", "under", "again", "further", "then",
        "once", "here", "there", "when", "where", "why", "how", "all", "each",
        "every", "both", "few", "more", "most", "other", "some", "such", "no",
        "nor", "not", "only", "own", "same", "so", "than", "too", "very",
        "just", "because", "but", "and", "or", "if", "while", "about", "up",
        "it", "its", "i", "me", "my", "we", "our", "you", "your", "he", "him",
        "his", "she", "her", "they", "them", "their", "this", "that", "these",
        "those", "what", "which", "who", "whom", "s", "t", "don", "re", "ve",
        "ll", "d", "m", "like", "get", "got", "really", "thing", "people",
    }

    words: list[str] = []
    for p in posts:
        text = (p.title or "") + " " + p.text
        for w in text.lower().split():
            cleaned = "".join(c for c in w if c.isalnum())
            if cleaned and len(cleaned) > 2 and cleaned not in stop_words:
                words.append(cleaned)

    most_common = Counter(words).most_common(top_n)
    return " ".join(w for w, _ in most_common) if most_common else "general"
