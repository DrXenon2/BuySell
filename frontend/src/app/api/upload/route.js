import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif'
];

/**
 * POST /api/upload - Upload d'un fichier
 */
export async function POST(request) {
  try {
    if (request.method !== 'POST') {
      return NextResponse.json(
        { error: 'Méthode non autorisée' },
        { status: 405 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const folder = formData.get('folder') || 'products';
    const userId = formData.get('userId');

    // Validation
    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'ID utilisateur requis' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { 
          error: 'Type de fichier non autorisé',
          allowedTypes: ALLOWED_MIME_TYPES,
          receivedType: file.type
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          error: 'Fichier trop volumineux',
          maxSize: MAX_FILE_SIZE,
          currentSize: file.size
        },
        { status: 400 }
      );
    }

    // Générer nom unique
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${folder}/${userId}/${timestamp}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;

    // Convertir en buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload vers Supabase
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Erreur upload Supabase:', error);
      return NextResponse.json(
        { error: `Échec de l'upload: ${error.message}` },
        { status: 500 }
      );
    }

    // URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      message: 'Fichier uploadé avec succès',
      data: {
        fileName: data.path,
        publicUrl,
        size: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erreur upload:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload - Lister les fichiers
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const folder = searchParams.get('folder') || 'products';

    if (!userId) {
      return NextResponse.json(
        { error: 'ID utilisateur requis' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.storage
      .from('uploads')
      .list(`${folder}/${userId}`, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('Erreur liste fichiers:', error);
      return NextResponse.json(
        { error: `Erreur de récupération: ${error.message}` },
        { status: 500 }
      );
    }

    const filesWithUrls = data?.map(file => {
      const publicUrl = supabase.storage
        .from('uploads')
        .getPublicUrl(`${folder}/${userId}/${file.name}`).data.publicUrl;

      return {
        name: file.name,
        publicUrl,
        size: file.metadata?.size,
        mimeType: file.metadata?.mimetype,
        createdAt: file.created_at
      };
    }) || [];

    return NextResponse.json({
      success: true,
      data: {
        files: filesWithUrls,
        count: filesWithUrls.length
      }
    });

  } catch (error) {
    console.error('Erreur récupération fichiers:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload - Supprimer un fichier
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');
    const userId = searchParams.get('userId');

    if (!fileName || !userId) {
      return NextResponse.json(
        { error: 'Nom de fichier et ID utilisateur requis' },
        { status: 400 }
      );
    }

    if (!fileName.includes(userId)) {
      return NextResponse.json(
        { error: 'Non autorisé à supprimer ce fichier' },
        { status: 403 }
      );
    }

    const { error } = await supabase.storage
      .from('uploads')
      .remove([fileName]);

    if (error) {
      console.error('Erreur suppression:', error);
      return NextResponse.json(
        { error: `Échec de la suppression: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Fichier supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression fichier:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
