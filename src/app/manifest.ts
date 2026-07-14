import type { MetadataRoute } from 'next'

// Obrigatório em `output: export`: gera o manifest como arquivo estático.
export const dynamic = 'force-static'

// Manifesto de web app: permite instalar na tela de início (iPhone/Android)
// abrindo em tela cheia, sem a interface do navegador. Os caminhos precisam
// do basePath (/gestao-aulas) escrito à mão — o manifest não o herda.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Gestão de Aulas',
    short_name: 'Gestão de Aulas',
    description: 'Organize alunos, agenda e finanças das suas aulas particulares.',
    start_url: '/gestao-aulas/',
    scope: '/gestao-aulas/',
    display: 'standalone',
    background_color: '#f3f4f6',
    theme_color: '#8da573',
    icons: [
      {
        src: '/gestao-aulas/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/gestao-aulas/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
