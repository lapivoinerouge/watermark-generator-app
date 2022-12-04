const Jimp = require('jimp');
const inquirer = require('inquirer');
const { existsSync } = require('fs');

const addTextWatermarkToImage = async function(inputFileName, text) {
  try {
    const image = await Jimp.read(prepareFilePath(inputFileName));
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
    const textData = {
      text: text,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
    };

    image.print(font, 0, 0, textData, image.getWidth(), image.getHeight());
    await image.quality(100).writeAsync(prepareFilePath(prepareOutputFileName(inputFileName, 'with-watermark')));

    console.log('Text watermark has been added.');
  } catch (e) {
    console.log('Something went wrong... Try again!')
  }
};

const addImageWatermarkToImage = async function(inputFileName, watermarkFile) {
  try {
    const image = await Jimp.read(prepareFilePath(inputFileName));
    const watermark = await Jimp.read(watermarkFile);
    const x = image.getWidth() / 2 - watermark.getWidth() / 2;
    const y = image.getHeight() / 2 - watermark.getHeight() / 2;

    image.composite(watermark, x, y, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 0.5,
    });
    await image.quality(100).writeAsync(prepareFilePath(prepareOutputFileName(inputFileName, 'with-watermark')));

    console.log('Image watermark has been added.');
  } catch (e) {
    console.log('Something went wrong... Try again!');
  }
};

const brightenImage = async function(inputFileName, val) {
  try {
    if (val < -1 || val > 1) {
      console.log('The value must be from -1 to 1. Try again.');
    }
    const image = await Jimp.read(prepareFilePath(inputFileName));
    await image.brightness(val).writeAsync(prepareFilePath(prepareOutputFileName(inputFileName, 'modified-brightness')));
    console.log('Image brightness has been increased.');
  } catch (e) {
    console.log('Something went wrong... Try again!');
  }
};

const increaseContrast = async function(inputFileName, val) {
  try {
    if (val < -1 || val > 1) {
      console.log('The value must be from -1 to 1. Try again.');
    }
    const image = await Jimp.read(prepareFilePath(inputFileName));
    await image.contrast(val).writeAsync(prepareFilePath(prepareOutputFileName(inputFileName, 'modified-contrast')));
    console.log('Image contrast has been increased.');
  } catch (e) {
    console.log('Something went wrong... Try again!');
  }
};

const makeImageBlackAndWhite = async function(inputFileName) {
  try {
    const image = await Jimp.read(prepareFilePath(inputFileName));
    await image.grayscale().writeAsync(prepareFilePath(prepareOutputFileName(inputFileName, 'b-and-w')));
    console.log('Image colors were removed.');
  } catch (e) {
    console.log('Something went wrong... Try again!');
  }
};

const invertImage = async function(inputFileName) {
  try {
    const image = await Jimp.read(prepareFilePath(inputFileName));
    await image.invert().writeAsync(prepareFilePath(prepareOutputFileName(inputFileName, 'inverted')));
    console.log('Image has been inverted.');
  } catch (e) {
    console.log('Something went wrong... Try again!');
  }
};

const prepareFilePath = (filename) => {
  return `./img/${filename}`;
};

const prepareOutputFileName = (filename, suffix) => {
  const [ name, ext ] = filename.split('.');
  return `${name}-${suffix}.${ext}`;
};

const startApp = async () => {
  // Ask if user is ready
  const answer = await inquirer.prompt([{
      name: 'start',
      message: 'Hi! Welcome to "Watermark manager". Copy your image files to `/img` folder. Then you\'ll be able to use them in the app. Are you ready?',
      type: 'confirm'
    }]);

  // if answer is no, just quit the app
  if(!answer.start) process.exit();

  // ask about input file and watermark type
  const options = await inquirer.prompt([{
    name: 'inputImage',
    type: 'input',
    message: 'What file do you want to mark?',
    default: 'test.jpg',
  }, {
    name: 'watermarkType',
    type: 'list',
    choices: ['Text watermark', 'Image watermark'],
  }]);

  let inputFileName = options.inputImage;
  const inputFile = prepareFilePath(inputFileName);

  if(options.watermarkType === 'Text watermark') {
    const text = await inquirer.prompt([{
      name: 'value',
      type: 'input',
      message: 'Type your watermark text:',
    }])
    options.watermarkText = text.value;
    if (existsSync(inputFile)) {
      addTextWatermarkToImage(inputFileName, options.watermarkText);
      inputFileName = prepareOutputFileName(inputFileName, 'with-watermark');
    } else {
      console.log(`The file ${inputFile} doesn't exist.`);
    }
    
  } else {
    const image = await inquirer.prompt([{
      name: 'filename',
      type: 'input',
      message: 'Type your watermark name:',
      default: 'logo.png',
    }])
    options.watermarkImage = image.filename;
    const watermarkFile = './img/' + options.watermarkImage;
    if (!existsSync(inputFile)) {
      console.log(`The file ${inputFile} doesn't exist.`);
    } else if (!existsSync(watermarkFile)) {
      console.log(`The file ${watermarkFile} doesn't exist.`);
    } else {
      addImageWatermarkToImage(inputFileName, prepareFilePath(options.watermarkImage));
      inputFileName = prepareOutputFileName(inputFileName, 'with-watermark');
    }
  }

  const edit = await inquirer.prompt([{
    name: 'editMore',
    type: 'confirm',
    message: 'Do you want to edit file?',
  }]);

  if (edit.editMore) {
    const editOptions = await inquirer.prompt([{
      name: 'option',
      type: 'list',
      choices: ['Make image brighter', 'Increase contrast', 'Make image b&w', 'Invert image'],
    }]);

    if (editOptions.option === 'Make image brighter') {
      const brightness = await inquirer.prompt([{
        name: 'value',
        type: 'number',
        message: 'Enter value from -1 to 1 to change brightness',
      }]);
      brightenImage(inputFileName, brightness.value);

    } else if (editOptions.option === 'Increase contrast') {
      const contrast = await inquirer.prompt([{
        name: 'value',
        type: 'number',
        message: 'Enter value from -1 to 1 to change contrast',
      }]);
      increaseContrast(inputFileName, contrast.value);

    } else if (editOptions.option === 'Make image b&w') {
      makeImageBlackAndWhite(inputFileName);

    } else {
      invertImage(inputFileName);
    }
  }
  startApp();
};

startApp();