import laspy
import lazrs

las = laspy.read(r'public\data\scene1.las')
las.write(r'public\data\scene1.laz')
print('Compressed to LAZ')