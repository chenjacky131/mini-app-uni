const fs = require('fs');
const path = require('path');
const { load } = require('@loaders.gl/core');
const { LASLoader } = require('@loaders.gl/las');

async function analyzeLas() {
  try {
    const filePath = path.join(__dirname, 'public/static/data/segment_segment_1120-12025_11_20_15_58_052025_11_20_16_08_37.las');
    
    console.log('Loading file:', filePath);
    
    // 先检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.error('文件不存在:', filePath);
      return;
    }
    
    // 读取文件内容
    const buffer = fs.readFileSync(filePath);
    console.log('文件大小:', buffer.length, 'bytes');
    
    // 使用 load 函数加载
    const data = await load(
      buffer,
      LASLoader,
      { las: { skip: 1 } }
    );

    console.log('\n=== 数据类型 ===');
    console.log('typeof data:', typeof data);
    console.log('data constructor:', data?.constructor?.name);
    console.log('Array.isArray:', Array.isArray(data));

    if (data && data.length > 0) {
      console.log('\n=== 总点数 ===');
      console.log('data.length:', data.length);

      console.log('\n=== 第一个点的完整结构 ===');
      console.log(JSON.stringify(data[0], null, 2));

      console.log('\n=== 第一个点的所有 key ===');
      console.log(Object.keys(data[0]));

      console.log('\n=== 检查常见字段 ===');
      const p = data[0];
      console.log('position:', p.position);
      console.log('color:', p.color);
      console.log('coordinates:', p.coordinates);
      console.log('x:', p.x, 'y:', p.y, 'z:', p.z);
      console.log('red:', p.red, 'green:', p.green, 'blue:', p.blue);

      console.log('\n=== 第二个点 ===');
      console.log(JSON.stringify(data[1], null, 2));

      console.log('\n=== 最后一个点 ===');
      console.log(JSON.stringify(data[data.length - 1], null, 2));
    } else if (data && data.header) {
      console.log('\n=== 有 header ===');
      console.log('header:', JSON.stringify(data.header, null, 2));
      console.log('attributes:', Object.keys(data));
      if (data.attributes) {
        console.log('attributes keys:', Object.keys(data.attributes));
      }
    } else {
      console.log('\n=== 完整 data ===');
      const str = JSON.stringify(data, null, 2);
      console.log(str?.substring(0, 3000));
    }
  } catch (err) {
    console.error('加载失败:', err.message);
    console.error(err.stack);
  }
}

analyzeLas();
