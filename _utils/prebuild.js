const fs = require("fs");
const path = require("path");

const enMeta = {
  datasource: require("../datasource/faq_en.json"),
  summary: path.join(__dirname, "../en/SUMMARY.md"),
  readme: path.join(__dirname, "../en/README.md"),
  tags: path.join(__dirname, "../en/tags.md"),
  tagsName: "Tags"
};

const zhMeta = {
  datasource: require("../datasource/faq_zh.json"),
  summary: path.join(__dirname, "../zh_hans/SUMMARY.md"),
  readme: path.join(__dirname, "../zh_hans/README.md"),
  tags: path.join(__dirname, "../zh_hans/tags.md"),
  tagsName: "标签"
};

function formatHashPath(hashPath = "") {
  return hashPath
    .toLowerCase()
    .replace(/[ /]/gim, "-")
    .replace(/[\?&]/gim, "");
}

function start(data = {}) {
  data.dataMap = {};
  console.log(`发现 ${data.datasource.length} 个问题`);
  // 按照 summary 来索引
  data.datasource.forEach(item => {
    data.dataMap[item.category] = data.dataMap[item.category] || [];
    data.dataMap[item.category].push(item);
  });

  // summary
  // 按照 category 数量排序
  let category = Object.keys(data.dataMap).sort(($1, $2) => {
    return data.dataMap[$1].length > data.dataMap[$2].length ? -1 : 1;
  });
  // 入门概念放在前面
  category.includes("入门概念")
    ? category.unshift("入门概念")
    : category.unshift("Introduction");
  category = [...new Set(category)];
  const summary = ["# Summary", ""];
  console.log(`发现 ${category.length} 个主题`);
  // 开始处理
  category.forEach((item, i) => {
    summary.push(`* [${item}](README.md#${formatHashPath(item)})`);
  });
  summary.push(`* [${data.tagsName}](tags.md)`);
  // 写入 summary
  fs.writeFileSync(data.summary, summary.join("\n"));

  // tags
  // 写入 tags.md
  let tags = [];
  const tagsMap = {};
  data.datasource.forEach(item => {
    tags = tags.concat(item.tag);
    // 每个 tag 里包含多少主题
    item.tag.forEach(tag => {
      tagsMap[tag] = tagsMap[item.tag] || [];
      tagsMap[tag].push(item.title);
    });
  });
  tags = [...new Set(tags)];
  console.log(`发现 ${tags.length} 个标签`);

  const tagContent = [`# ${data.tagsName}`, "", ""];
  tags.forEach((tag, i) => {
    const titles = tagsMap[tag];
    if (titles.length > 0) {
      if (i !== 0) {
        tagContent.push("", "", "");
      }

      tagContent.push(`### ${tag}`, "");
      tagContent.push(
        titles
          .map(title => `- [${title}](README.md#${formatHashPath(title)})`)
          .join("\n")
      );
    }
  });
  fs.writeFileSync(data.tags, tagContent.join("\n"));

  // content
  // 写入 README.md
  const readme = [];
  category.forEach((item, i) => {
    if (i !== 0) {
      readme.push("", "<hr>", "", "", "");
    }
    readme.push(`# ${item}`);

    data.dataMap[item].forEach((item2, j) => {
      if (j !== 0) {
        readme.push("", "", "", "");
      }
      // 标题
      readme.push(`### ${item2.title}`);
      // tags
      if (item2.tag && item2.tag.length > 0) {
        readme.push(
          "",
          `**${data.tagsName}:** ${item2.tag
            .map(tag => `[*${tag}*](tags.md#${formatHashPath(tag)})`)
            .join("  ")}`
        );
      }
      // content
      readme.push("", "", item2.content);
    });
  });
  fs.writeFileSync(data.readme, readme.join("\n"));
}

console.log("中文 FAQ:");
start(zhMeta);

console.log("\n英文 FAQ:");
start(enMeta);

console.log("\n初始化完成 Done");
