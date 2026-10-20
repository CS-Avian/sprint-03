const form = document.getElementById("search-form");
const usernameInput = document.getElementById("username");
const searchButton = document.getElementById("search-btn");
const result = document.getElementById("result");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(isoString) {
  const date = new Date(isoString);
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function createElement(tag, text) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  return element;
}

function showMessage(message) {
  result.replaceChildren(createElement("p", message));
}

function renderProfile(user, repos) {
  const card = createElement("div");
  card.className = "card";

  const avatar = createElement("img");
  avatar.src = user.avatar_url;
  avatar.alt = `${user.login}'s avatar`;

  const name = createElement("h2", user.name || user.login);
  const bio = createElement("p", user.bio || "No bio available.");
  const joined = createElement("p", `Joined: ${formatDate(user.created_at)}`);

  const portfolio = createElement("p");
  if (user.blog) {
    const url = /^https?:\/\//i.test(user.blog) ? user.blog : `https://${user.blog}`;
    const link = createElement("a", user.blog);
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    portfolio.append("Portfolio: ", link);
  } else {
    portfolio.textContent = "Portfolio: Not provided";
  }

  card.append(avatar, name, bio, joined, portfolio);

  const repoCard = createElement("div");
  repoCard.className = "card";
  repoCard.append(createElement("h2", "Latest Repositories"));

  if (repos.length === 0) {
    repoCard.append(createElement("p", "No public repositories."));
  } else {
    const list = createElement("ul");
    repos.forEach((repo) => {
      const item = createElement("li");
      const link = createElement("a", repo.name);
      link.href = repo.html_url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      item.append(link, ` (created ${formatDate(repo.created_at)})`);
      list.append(item);
    });
    repoCard.append(list);
  }

  result.replaceChildren(card, repoCard);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = usernameInput.value.trim();
  if (!username) return;

  showMessage("Loading...");
  searchButton.disabled = true;

  try {
    const userResponse = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);

    if (userResponse.status === 404) {
      showMessage("User Not Found");
      return;
    }
    if (!userResponse.ok) {
      throw new Error(`Request failed with status ${userResponse.status}`);
    }
    const user = await userResponse.json();

    const reposResponse = await fetch(`${user.repos_url}?sort=created&direction=desc&per_page=5`);
    if (!reposResponse.ok) {
      throw new Error(`Request failed with status ${reposResponse.status}`);
    }
    const repos = await reposResponse.json();

    renderProfile(user, repos);
  } catch (error) {
    showMessage("Something went wrong. Please try again.");
  } finally {
    searchButton.disabled = false;
  }
});