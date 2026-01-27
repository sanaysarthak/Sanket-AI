"""
NLP Processor for Entity Extraction, Topic Detection, Word Cloud and Bag of Words
Uses spaCy for NLP and provides data for visualization
"""
import re
from collections import Counter
from typing import Dict, List, Tuple
from .ingestion import ingestion_service
from .ai_engine import ai_engine

# Common English stopwords for filtering
STOPWORDS = {
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
    'shall', 'can', 'need', 'dare', 'ought', 'used', 'it', 'its', 'this', 'that',
    'these', 'those', 'i', 'you', 'he', 'she', 'we', 'they', 'what', 'which', 'who',
    'whom', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
    'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
    'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there', 'then',
    'once', 'if', 'any', 'about', 'into', 'through', 'during', 'before', 'after',
    'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further',
    'am', 'being', 'get', 'got', 'getting', 'goes', 'going', 'gone', 'come', 'came',
    'coming', 'see', 'seen', 'seeing', 'saw', 'say', 'said', 'saying', 'says', 'take',
    'took', 'taking', 'make', 'made', 'making', 'know', 'knew', 'known', 'knowing',
    'think', 'thought', 'thinking', 'give', 'gave', 'given', 'giving', 'find', 'found',
    'finding', 'tell', 'told', 'telling', 'ask', 'asked', 'asking', 'seem', 'seemed',
    'seeming', 'seems', 'leave', 'left', 'leaving', 'put', 'putting', 'keep', 'kept',
    'keeping', 'let', 'lets', 'letting', 'begin', 'began', 'beginning', 'show', 'showed',
    'shown', 'showing', 'hear', 'heard', 'hearing', 'play', 'played', 'playing', 'run',
    'ran', 'running', 'move', 'moved', 'moving', 'live', 'lived', 'living', 'believe',
    'believed', 'believing', 'hold', 'held', 'holding', 'bring', 'brought', 'bringing',
    'happen', 'happened', 'happening', 'write', 'wrote', 'written', 'writing', 'provide',
    'provided', 'providing', 'sit', 'sat', 'sitting', 'stand', 'stood', 'standing',
    'lose', 'lost', 'losing', 'pay', 'paid', 'paying', 'meet', 'met', 'meeting',
    'include', 'included', 'including', 'continue', 'continued', 'continuing', 'set',
    'learn', 'learned', 'learning', 'change', 'changed', 'changing', 'lead', 'led',
    'leading', 'understand', 'understood', 'understanding', 'watch', 'watched', 'watching',
    'follow', 'followed', 'following', 'stop', 'stopped', 'stopping', 'create', 'created',
    'creating', 'speak', 'spoke', 'spoken', 'speaking', 'read', 'reading', 'allow',
    'allowed', 'allowing', 'add', 'added', 'adding', 'spend', 'spent', 'spending',
    'grow', 'grew', 'grown', 'growing', 'open', 'opened', 'opening', 'walk', 'walked',
    'walking', 'win', 'won', 'winning', 'offer', 'offered', 'offering', 'remember',
    'remembered', 'remembering', 'love', 'loved', 'loving', 'consider', 'considered',
    'considering', 'appear', 'appeared', 'appearing', 'buy', 'bought', 'buying', 'wait',
    'waited', 'waiting', 'serve', 'served', 'serving', 'die', 'died', 'dying', 'send',
    'sent', 'sending', 'expect', 'expected', 'expecting', 'build', 'built', 'building',
    'stay', 'stayed', 'staying', 'fall', 'fell', 'fallen', 'falling', 'cut', 'cutting',
    'reach', 'reached', 'reaching', 'kill', 'killed', 'killing', 'remain', 'remained',
    'remaining', 'suggest', 'suggested', 'suggesting', 'raise', 'raised', 'raising',
    'pass', 'passed', 'passing', 'sell', 'sold', 'selling', 'require', 'required',
    'requiring', 'report', 'reported', 'reporting', 'decide', 'decided', 'deciding',
    'pull', 'pulled', 'pulling'
}

# Topic keywords for detection with weights
TOPIC_KEYWORDS = {
    "Protest": {
        "keywords": ["protest", "rally", "demonstration", "march", "slogan", "crowd", "mob", "agitation", "dharna", "strike", "bandh"],
        "weight": 2.0
    },
    "Violence": {
        "keywords": ["violence", "attack", "assault", "fight", "weapon", "injury", "hurt", "beating", "clash", "riot", "arson"],
        "weight": 2.5
    },
    "Traffic": {
        "keywords": ["traffic", "jam", "blocked", "road", "congestion", "accident", "vehicle", "highway", "junction", "signal"],
        "weight": 1.5
    },
    "Emergency": {
        "keywords": ["emergency", "ambulance", "fire", "help", "rescue", "disaster", "urgent", "critical", "sos", "911"],
        "weight": 2.0
    },
    "Crime": {
        "keywords": ["theft", "robbery", "murder", "kidnap", "burglary", "suspect", "criminal", "police", "arrest", "custody", "fir"],
        "weight": 2.5
    },
    "Surveillance": {
        "keywords": ["cctv", "camera", "footage", "monitoring", "surveillance", "detected", "spotted", "identified", "tracking"],
        "weight": 1.5
    },
    "Social Unrest": {
        "keywords": ["unrest", "tension", "communal", "religious", "dispute", "conflict", "public", "gathering", "disturbance"],
        "weight": 2.0
    },
    "Missing Person": {
        "keywords": ["missing", "lost", "disappeared", "whereabouts", "search", "locate", "child", "woman", "elderly"],
        "weight": 2.0
    },
    "Drugs": {
        "keywords": ["drugs", "narcotics", "substance", "trafficking", "dealer", "contraband", "seized", "smuggling"],
        "weight": 2.5
    },
    "Cyber": {
        "keywords": ["cyber", "online", "fraud", "scam", "hacking", "phishing", "digital", "internet", "social media"],
        "weight": 2.0
    }
}


def tokenize_text(text: str) -> List[str]:
    """Tokenize text into words, removing punctuation and stopwords."""
    # Convert to lowercase and extract words
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    # Filter stopwords
    return [w for w in words if w not in STOPWORDS]


def get_entity_extraction() -> Dict:
    """
    Extract entities from all ingested data using spaCy.
    Returns entities grouped by type with counts.
    """
    data = ingestion_service.get_all_data()
    
    entities_by_type = {
        "PERSON": [],
        "ORG": [],
        "GPE": [],  # Geo-Political Entity (locations)
        "FAC": [],  # Facilities
        "LOC": [],  # Non-GPE locations
        "EVENT": [],
        "DATE": [],
        "TIME": [],
        "MONEY": [],
        "QUANTITY": [],
    }
    
    all_entities = []
    
    for item in data:
        try:
            doc = ai_engine.nlp(item.content)
            for ent in doc.ents:
                entity_data = {
                    "text": ent.text,
                    "label": ent.label_,
                    "source": item.source,
                    "source_id": item.id
                }
                all_entities.append(entity_data)
                
                if ent.label_ in entities_by_type:
                    entities_by_type[ent.label_].append(ent.text)
        except Exception as e:
            continue
    
    # Count entities by type
    entity_counts = {}
    for label, texts in entities_by_type.items():
        if texts:
            counter = Counter(texts)
            entity_counts[label] = [
                {"text": text, "count": count}
                for text, count in counter.most_common(20)
            ]
    
    # Top entities overall
    all_entity_texts = [e["text"] for e in all_entities]
    top_entities = Counter(all_entity_texts).most_common(30)
    
    return {
        "entities_by_type": entity_counts,
        "top_entities": [{"text": t, "count": c} for t, c in top_entities],
        "total_entities": len(all_entities),
        "entity_type_distribution": {
            label: len(texts) for label, texts in entities_by_type.items() if texts
        }
    }


def get_topic_detection() -> Dict:
    """
    Detect topics from all ingested data using keyword matching.
    Returns topic distribution and trending topics.
    """
    data = ingestion_service.get_all_data()
    
    topic_counts = Counter()
    topic_sources = {topic: {"social_media": 0, "cctv": 0, "police": 0, "emergency": 0} 
                     for topic in TOPIC_KEYWORDS.keys()}
    topic_items = {topic: [] for topic in TOPIC_KEYWORDS.keys()}
    
    for item in data:
        text_lower = item.content.lower()
        detected_topics = []
        
        for topic, config in TOPIC_KEYWORDS.items():
            for keyword in config["keywords"]:
                if keyword in text_lower:
                    topic_counts[topic] += 1
                    detected_topics.append(topic)
                    
                    source_key = item.source if item.source in topic_sources[topic] else "police"
                    topic_sources[topic][source_key] += 1
                    
                    topic_items[topic].append({
                        "id": item.id,
                        "snippet": item.content[:100] + "..." if len(item.content) > 100 else item.content,
                        "source": item.source
                    })
                    break  # Only count once per topic per item
    
    # Calculate topic weights/scores
    topic_scores = []
    for topic, count in topic_counts.items():
        weight = TOPIC_KEYWORDS[topic]["weight"]
        score = count * weight
        topic_scores.append({
            "topic": topic,
            "count": count,
            "weight": weight,
            "score": round(score, 2),
            "sources": topic_sources[topic],
            "sample_items": topic_items[topic][:3]  # Top 3 samples
        })
    
    # Sort by score
    topic_scores.sort(key=lambda x: x["score"], reverse=True)
    
    return {
        "topics": topic_scores,
        "total_topic_mentions": sum(topic_counts.values()),
        "top_topic": topic_scores[0]["topic"] if topic_scores else None,
        "trending": [t["topic"] for t in topic_scores[:5]]
    }


def get_word_cloud_data() -> Dict:
    """
    Generate word frequency data for word cloud visualization.
    Returns words with their frequencies/weights.
    """
    data = ingestion_service.get_all_data()
    
    all_words = []
    source_words = {"social_media": [], "cctv": [], "police": [], "emergency": []}
    
    for item in data:
        tokens = tokenize_text(item.content)
        all_words.extend(tokens)
        
        source_key = item.source if item.source in source_words else "police"
        source_words[source_key].extend(tokens)
    
    # Overall word frequencies
    word_counts = Counter(all_words)
    
    # Word cloud data (top 100 words)
    word_cloud_items = []
    for word, count in word_counts.most_common(100):
        # Scale the value for better visualization
        word_cloud_items.append({
            "text": word,
            "value": count,
            "size": min(60, max(12, count * 3))  # Font size between 12-60
        })
    
    # Source-specific word clouds
    source_clouds = {}
    for source, words in source_words.items():
        if words:
            counter = Counter(words)
            source_clouds[source] = [
                {"text": w, "value": c, "size": min(50, max(10, c * 4))}
                for w, c in counter.most_common(50)
            ]
    
    return {
        "words": word_cloud_items,
        "source_clouds": source_clouds,
        "total_words": len(all_words),
        "unique_words": len(word_counts)
    }


def get_bag_of_words() -> Dict:
    """
    Generate bag of words analysis with TF-IDF-like scoring.
    Returns structured word frequency data with metadata.
    """
    data = ingestion_service.get_all_data()
    
    # Document-level bag of words
    documents = []
    all_words = []
    
    for item in data:
        tokens = tokenize_text(item.content)
        all_words.extend(tokens)
        
        doc_word_counts = Counter(tokens)
        if doc_word_counts:
            documents.append({
                "id": item.id,
                "source": item.source,
                "word_count": len(tokens),
                "unique_words": len(doc_word_counts),
                "top_words": [{"word": w, "count": c} for w, c in doc_word_counts.most_common(10)]
            })
    
    # Global bag of words
    global_counts = Counter(all_words)
    
    # Calculate document frequency (how many docs contain each word)
    doc_frequency = Counter()
    for item in data:
        tokens = set(tokenize_text(item.content))
        for token in tokens:
            doc_frequency[token] += 1
    
    # Calculate TF-IDF-like importance score
    num_docs = len(data) if data else 1
    word_importance = []
    
    for word, tf in global_counts.most_common(100):
        df = doc_frequency.get(word, 1)
        idf = num_docs / df  # Inverse document frequency
        tfidf = tf * (1 + (idf / num_docs))  # Simplified TF-IDF
        
        word_importance.append({
            "word": word,
            "frequency": tf,
            "doc_count": df,
            "importance": round(tfidf, 2),
            "percentage": round((tf / len(all_words)) * 100, 2) if all_words else 0
        })
    
    # Sort by importance
    word_importance.sort(key=lambda x: x["importance"], reverse=True)
    
    # Word categories (group by first letter for visualization)
    word_by_alpha = {}
    for word, count in global_counts.most_common(200):
        first_letter = word[0].upper()
        if first_letter not in word_by_alpha:
            word_by_alpha[first_letter] = []
        word_by_alpha[first_letter].append({"word": word, "count": count})
    
    return {
        "bag_of_words": word_importance[:50],
        "total_words": len(all_words),
        "unique_words": len(global_counts),
        "vocabulary_size": len(global_counts),
        "avg_doc_length": round(len(all_words) / num_docs, 2) if num_docs > 0 else 0,
        "documents": documents[:20],  # Sample documents
        "alphabetical": word_by_alpha
    }


def get_full_nlp_analysis() -> Dict:
    """
    Get complete NLP analysis combining all features.
    """
    return {
        "entity_extraction": get_entity_extraction(),
        "topic_detection": get_topic_detection(),
        "word_cloud": get_word_cloud_data(),
        "bag_of_words": get_bag_of_words(),
        "timestamp": str(__import__('datetime').datetime.now())
    }
