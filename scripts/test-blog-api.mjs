const loginRes = await fetch("http://localhost:4000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@eroyalmango.com", password: "Admin@123456" }),
});
const loginJson = await loginRes.json();
const token = loginJson.data?.token;
console.log("login", loginRes.status, token ? "token ok" : loginJson);

const blogRes = await fetch("http://localhost:4000/api/blogs", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    title: "Test New Blog API",
    excerpt: "Test excerpt",
    content: "<p>Test content</p>",
    featuredImage: "/images/chaunsa-premium-variety.png",
    category: "Uncategorized",
    author: "E Royal Mango",
    authorEmail: "info@eroyalmango.com",
    status: "published",
  }),
});
const blogJson = await blogRes.json();
console.log("create", blogRes.status, JSON.stringify(blogJson, null, 2));
