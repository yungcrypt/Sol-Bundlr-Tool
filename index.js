const fs = require("fs-extra");
const Bundlr = require("@bundlr-network/client");
const imageFolder = "./images";

const getWallet = (args) => {
  const wallet_option = args;
  return JSON.parse(fs.readFileSync(wallet_option, { encoding: "utf8" }));
};

const uploadMetadata = async (filename_no_ext, image_url) => {
  const data = fs.readJSONSync(`./metadata/${filename_no_ext}.json`);

  data.image = image_url;
  data.properties.files[0].uri = image_url;

  // write and read back the metadata
  fs.writeJSONSync(`./metadata/${filename_no_ext}.json`, data);
};

const parseArgs = () => {
  var myArgs = process.argv.slice(2);
  if (myArgs.length != 1) {
    throw "Specify keypair path";
  }
  return myArgs[0];
};

const runUploadWithWallet = async (wallet, bundlr) => {
  const image_filenames = fs.readdirSync(imageFolder);

  for (i = 0; i < image_filenames.length; i++) {
    const no_ext_filename = image_filenames[i]
      .split(".")
      .slice(0, -1)
      .join(".");

    // push image URL to arweave by way of bundlr
    const respImg = await bundlr.uploader.uploadFile(
      `./images/${no_ext_filename}.png`
    );
    const respVideo = await bundlr.uploader.uploadFile(
      `./images/${no_ext_filename}.mp4`
    );

    const imageUrl = `https://arweave.net/${respImg.data.id}?ext=png`;
    const videoUrl = `https://arweave.net/${respVideo.data.id}?ext=mp4`;

    console.log(imageUrl);
    console.log(videoUrl);

    if (typeof imageUrl === "string") {
      // push metadata to arweave by way of bundlr
      await uploadMetadata(no_ext_filename);

      const respMeta = await bundlr.uploader.uploadFile(
        `./metadata/${no_ext_filename}.json`
      );

      const metaUrl = `https://arweave.net/${respMeta.data.id}`;

      // write out the metadataurl to a txt file
      fs.writeFileSync(`./urls/${no_ext_filename}.txt`, metaUrl);

      console.log(metaUrl);
    }
  }
};

const runUpload = async () => {
  args = parseArgs();
  const wallet = await getWallet(args);
  console.log(wallet.toString());
  const bundlr = new Bundlr.default(
    "https://devnet.bundlr.network",
    "solana",
    wallet,
    { providerUrl: "https://api.devnet.solana.com" }
  );
  console.log((await bundlr.getLoadedBalance()).toString())

  await runUploadWithWallet(wallet, bundlr);
};

runUpload();
