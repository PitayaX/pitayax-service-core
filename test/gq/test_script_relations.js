{
  "version": "2.0.0",
  "action": "mongo",
  "parts":
  {
    "id": "posts",
    "headers": { "target": "post" },
    "body":
    {
      "query": {"tags": { "$in": ["key1", "312"] }},
      "fields": ["_id", "publishedOn", "publishedBy"]
    },
    "relations": {
      "target": "user",
      "joins": { "publishedBy":"userToken" },
      "as":{ "name": "author", "fields": ["_id", "userToken", "nick", "email"] }
    }
  }
}
