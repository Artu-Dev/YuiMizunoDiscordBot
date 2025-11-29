import { createCanvas, loadImage } from '@napi-rs/canvas';
import https from 'https';

// Função para buscar imagem aleatória
async function getRandomImage() {
  const width = 1200;
  const height = 400;
  const imageUrl = `https://picsum.photos/${width}/${height}`;
  
  return new Promise((resolve, reject) => {
    https.get(imageUrl, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(loadImage(buffer));
      });
      response.on('error', reject);
    }).on('error', reject);
  });
}

// Função auxiliar para quebrar texto em linhas
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

export async function createNewsImage(headline, article) {
  const width = 1200;
  const padding = 50;
  const contentWidth = width - (padding * 2);
  
  // Criar canvas temporário para calcular altura do artigo
  const tempCanvas = createCanvas(width, 100);
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.font = '18px Arial';
  
  const articleLines = wrapText(tempCtx, article, contentWidth);
  const articleHeight = articleLines.length * 28; // 28px de altura por linha
  
  // Calcular altura total necessária
  const headerHeight = 80;
  const imageHeight = 400;
  const titleAreaHeight = 200;
  const articlePadding = 40;
  const footerHeight = 60;
  
  const totalHeight = headerHeight + imageHeight + titleAreaHeight + articleHeight + articlePadding + footerHeight;
  
  // Criar canvas final
  const canvas = createCanvas(width, totalHeight);
  const ctx = canvas.getContext('2d');

  // Fundo branco
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, totalHeight);

  // ===== HEADER (Barra vermelha G1) =====
  ctx.fillStyle = '#C4170C';
  ctx.fillRect(0, 0, width, headerHeight);

  // Logo "G1"
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 50px Arial';
  ctx.fillText('G1', padding, 55);

  // Texto "GLOBO"
  ctx.font = 'bold 16px Arial';
  ctx.fillText('GLOBO', 120, 55);

  // Tag "ÚLTIMA HORA"
  const tagX = width - 250;
  const tagY = 20;
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(tagX, tagY, 200, 40);
  
  ctx.fillStyle = '#C4170C';
  ctx.font = 'bold 18px Arial';
  ctx.fillText('🔴 ÚLTIMA HORA', tagX + 10, tagY + 27);

  // ===== IMAGEM ALEATÓRIA =====
  let currentY = headerHeight;
  try {
    const randomImg = await getRandomImage();
    ctx.drawImage(randomImg, 0, currentY, width, imageHeight);
    
    // Overlay escuro na parte inferior para contraste
    const overlayGradient = ctx.createLinearGradient(0, currentY + imageHeight - 100, 0, currentY + imageHeight);
    overlayGradient.addColorStop(0, 'rgba(0,0,0,0)');
    overlayGradient.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = overlayGradient;
    ctx.fillRect(0, currentY + imageHeight - 100, width, 100);
  } catch (error) {
    console.error('Erro ao carregar imagem:', error);
    // Fallback: gradiente vermelho
    const gradient = ctx.createLinearGradient(0, currentY, 0, currentY + imageHeight);
    gradient.addColorStop(0, '#C4170C');
    gradient.addColorStop(1, '#8B0F06');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, currentY, width, imageHeight);
  }
  currentY += imageHeight;

  // ===== MANCHETE =====
  ctx.fillStyle = '#1A1A1A';
  ctx.font = 'bold 42px Arial';
  
  const titleLines = wrapText(ctx, headline, contentWidth);
  const titleLineHeight = 55;
  currentY += 50;

  titleLines.forEach((line, index) => {
    ctx.fillText(line, padding, currentY + (index * titleLineHeight));
  });
  currentY += (titleLines.length * titleLineHeight) + 30;

  // Linha divisória vermelha
  ctx.strokeStyle = '#C4170C';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(padding, currentY);
  ctx.lineTo(width - padding, currentY);
  ctx.stroke();
  currentY += 20;

  // Data e hora
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });
  const timeStr = now.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  ctx.fillStyle = '#666666';
  ctx.font = '16px Arial';
  ctx.fillText(`${dateStr} às ${timeStr}`, padding, currentY);
  
  // Badge "VERIFICADO"
  ctx.fillStyle = '#C4170C';
  ctx.font = 'bold 15px Arial';
  ctx.fillText('✓ NOTÍCIA VERIFICADA', width - 250, currentY);
  currentY += 40;

  // ===== ARTIGO COMPLETO =====
  ctx.fillStyle = '#333333';
  ctx.font = '18px Arial';
  
  const articleLineHeight = 28;
  articleLines.forEach((line, index) => {
    ctx.fillText(line, padding, currentY + (index * articleLineHeight));
  });
  currentY += (articleLines.length * articleLineHeight) + 30;

  // ===== RODAPÉ =====
  ctx.fillStyle = '#F5F5F5';
  ctx.fillRect(0, currentY, width, footerHeight);
  
  ctx.fillStyle = '#999999';
  ctx.font = 'italic 14px Arial';
  ctx.fillText('© G1 - Todos os direitos reservados | Esta notícia é fictícia', padding, currentY + 35);

  return canvas.toBuffer('image/png');
}