const fs = require("fs");
const path = require("path");

const categoryPathMap = require("../datasource/category_map.json");

const enMeta = {
  datasource: require("../datasource/faq_en_US.json"),
  summary: path.join(__dirname, "../en_US/SUMMARY.md"),
  readme: path.join(__dirname, "../en_US/README.md"),
  base: path.join(__dirname, "../en_US"),
  tags: path.join(__dirname, "../en_US/tags.md"),
  tagsName: "Tags"
};

const zhMeta = {
  datasource: require("../datasource/faq_zh_CN.json"),
  summary: path.join(__dirname, "../zh_CN/SUMMARY.md"),
  readme: path.join(__dirname, "../zh_CN/README.md"),
  base: path.join(__dirname, "../zh_CN"),
  tags: path.join(__dirname, "../zh_CN/tags.md"),
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
  console.log(`Find ${data.datasource.length} FAQ`);
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
  console.log(`Find ${category.length} Topics`);
  // 开始处理
  category.forEach((item, i) => {
    const categoryPath = categoryPathMap[item];
    if (!categoryPath) {
      throw new Error(item + " no category path");
    }
    summary.push(
      `* [${item}](${categoryPath || `README.md#${formatHashPath(item)}`})`
    );
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
      tagsMap[tag].push(item);
    });
  });
  tags = [...new Set(tags)];
  console.log(`发现 ${tags.length} 个标签`);

  const tagContent = [`# ${data.tagsName}`, "", ""];
  tags.forEach((tag, i) => {
    const tagItems = tagsMap[tag];
    if (tagItems.length > 0) {
      if (i !== 0) {
        tagContent.push("", "", "");
      }

      tagContent.push(`### ${tag}`, "");
      tagContent.push(
        tagItems
          .map(item => {
            const categoryPath = categoryPathMap[item.category] || "README.md";
            if (!categoryPath) {
              throw new Error(categoryPath + "no category path");
            }
            return `- [${item.title}](${categoryPath}#${formatHashPath(
              item.title
            )})`;
          })
          .join("\n")
      );
    }
  });
  fs.writeFileSync(data.tags, tagContent.join("\n"));

  // content
  // 写入 README.md
  const contents = {};
  category.forEach((item, i) => {
    const categoryContent = contents[item] || [];
    categoryContent.push(`# ${item}`);

    data.dataMap[item].forEach((item2, j) => {
      if (j !== 0) {
        categoryContent.push("", "", "", "");
      }
      // 标题
      categoryContent.push(`### ${item2.title}`);
      // tags
      if (item2.tag && item2.tag.length > 0) {
        categoryContent.push(
          "",
          `**${data.tagsName}:** ${item2.tag
            .map(tag => `[*${tag}*](tags.md#${formatHashPath(tag)})`)
            .join("  ")}`
        );
      }
      categoryContent.push("", "", item2.content);
      contents[item] = categoryContent;
    });
  });
  Object.entries(contents).forEach(item => {
    const [category, content] = item;
    const contentFile = categoryPathMap[category];
    if (!contentFile) {
      throw new Error(category + " no content path");
    }
    fs.writeFileSync(path.join(data.base, contentFile), content.join("\n"));
    console.log(contentFile);
  });
  // fs.writeFileSync(data.readme, readme.join("\n"));
}

console.log("中文 FAQ:");
start(zhMeta);

console.log("\n英文 FAQ:");
start(enMeta);

console.log("\n初始化完成 Done");
