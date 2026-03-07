/* === File Type System for OceanBoard === */

export const FileTypes = {
	EPISODE: 'episode',
	CHARACTER: 'character',
	OBJECT: 'object',
	SCENE: 'scene',
	ACTION: 'action',
	ATTRIBUTE: 'attribute'
};

export const FileTypeConfig = {
	[FileTypes.EPISODE]: {
		icon: 'description',
		color: '#E43967',
		name: 'Episode'
	},
	[FileTypes.CHARACTER]: {
		icon: 'person',
		color: '#4A90E2',
		name: 'Character'
	},
	[FileTypes.OBJECT]: {
		icon: 'category',
		color: '#F5A623',
		name: 'Object'
	},
	[FileTypes.SCENE]: {
		icon: 'landscape',
		color: '#7ED321',
		name: 'Scene'
	},
	[FileTypes.ACTION]: {
		icon: 'event',
		color: '#BD10E0',
		name: 'Action'
	},
	[FileTypes.ATTRIBUTE]: {
		icon: 'label',
		color: '#50E3C2',
		name: 'Attribute'
	}
};

export function getFileType(fileName) {
	if (fileName.startsWith('[EP')) return FileTypes.EPISODE;
	if (fileName.startsWith('[C]')) return FileTypes.CHARACTER;
	if (fileName.startsWith('[O]')) return FileTypes.OBJECT;
	if (fileName.startsWith('[S]')) return FileTypes.SCENE;
	if (fileName.startsWith('[A]')) return FileTypes.ACTION;
	if (fileName.startsWith('[AT]')) return FileTypes.ATTRIBUTE;
	return FileTypes.EPISODE;
}

export function getFileIcon(fileName) {
	const type = getFileType(fileName);
	return FileTypeConfig[type].icon;
}

export function getFileColor(fileName) {
	const type = getFileType(fileName);
	return FileTypeConfig[type].color;
}
