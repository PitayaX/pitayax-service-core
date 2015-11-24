{
  database:
  {
    default: "test1"
  },
  entity:
  {
    post:
    {
      model:
      {
        title: "String",
        abstract: "String",
        content: "String",
        tags: ["String"],
        publishedOn: { "type": "Date", "default": Date.now() },
        publishedBy: "String",
        status: "Number",
        viewCount: "Number",
        likeCount: "Number",
        CanComment: "Boolean"
      },
      options: { collection: "post" }
    }
  }
}
