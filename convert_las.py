import laspy

las = laspy.read(r'public\data\scene1.las')

header = laspy.LasHeader(version="1.3")
header.offsets = [0, 0, 0]
header.scales = [0.001, 0.001, 0.001]

new_las = laspy.LasData(header)
new_las.x = las.x
new_las.y = las.y
new_las.z = las.z
new_las.intensity = las.intensity

new_las.write(r'public\data\scene1_v13.las')
print('Converted to LAS 1.3')